import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById, useUpdateSession } from "../hooks/useSessions";
import debounce from "lodash.debounce";
import { PROBLEMS } from "../data/problems";
import { codeApi } from "../api/code";
import Navbar from "../components/Navbar";
import { socket } from "../lib/socket";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import { Loader2Icon, LinkIcon, LogOutIcon, PhoneOffIcon, ShieldAlertIcon, ShieldCheckIcon, MaximizeIcon, AlertTriangleIcon, BrainCircuitIcon, CameraIcon } from "lucide-react";
import CodeEditorPanel from "../components/CodeEditorPanel";
import TestResultsPanel from "../components/TestResultsPanel";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";
import toast from "react-hot-toast";
import useProctoring from "../hooks/useProctoring";
import useAIProctoring from "../hooks/useAIProctoring";
import useTranscription from "../hooks/useTranscription";
import { memo } from "react";

const ProblemPanel = memo(({ problemData }) => {
  if (!problemData) return null;
  return (
    <div className="p-6 space-y-6">
      {/* problem desc */}
      {problemData?.description && (
        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
          <h2 className="text-xl font-bold mb-4 text-base-content">Description</h2>
          <div className="space-y-3 text-base leading-relaxed">
            <p className="text-base-content/90">{problemData.description.text}</p>
            {problemData.description.notes?.map((note, idx) => (
              <p key={idx} className="text-base-content/90">
                {note}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* examples section */}
      {problemData?.examples && problemData.examples.length > 0 && (
        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
          <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>

          <div className="space-y-4">
            {problemData.examples.map((example, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-sm">{idx + 1}</span>
                  <p className="font-semibold text-base-content">Example {idx + 1}</p>
                </div>
                <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                  <div className="flex gap-2">
                    <span className="text-primary font-bold min-w-[70px]">Input:</span>
                    <span>{example.input}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-secondary font-bold min-w-[70px]">Output:</span>
                    <span>{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div className="pt-2 border-t border-base-300 mt-2">
                      <span className="text-base-content/60 font-sans text-xs">
                        <span className="font-semibold">Explanation:</span> {example.explanation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints */}
      {problemData?.constraints && problemData.constraints.length > 0 && (
        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
          <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
          <ul className="space-y-2 text-base-content/90">
            {problemData.constraints.map((constraint, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-primary">•</span>
                <code className="text-sm">{constraint}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRemoteUpdate = useRef(false); // prevents send-receive loop
  const [isTyping, setIsTyping] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();
  const updateSessionMutation = useUpdateSession();

  const session = sessionData?.session;
  const isHost = session?.host?.clerkId === user?.id;
  const isParticipant = session?.participant?.clerkId === user?.id;

  const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
    session,
    loadingSession,
    isHost,
    isParticipant
  );

  // ─── Proctoring (only active for candidates) ──────────────────────
  const isCandidate = isParticipant && !isHost;
  const { violationCount, fullscreenActive, enterFullscreen } =
    useProctoring(id, isCandidate, session?.status === "active", channel);

  // AI proctoring (phone/gaze/webcam detection)
  const { aiReady, cameraCount } =
    useAIProctoring(id, isCandidate, session?.status === "active", false, channel);

  // host-side: track violations reported by candidate in real-time
  const [hostViolationCount, setHostViolationCount] = useState(0);
  const [hostAiAlerts, setHostAiAlerts] = useState([]);

  // Deepgram Transcription
  const { liveTranscript, isTranscribing } = useTranscription(
    id,
    isCandidate,
    session?.status === "active",
    session?.status === "completed"
  );

  // problem selection is now done inside the session (decoupled from session title)
  const problems = useMemo(() => Object.values(PROBLEMS), []);
  const [selectedProblemTitle, setSelectedProblemTitle] = useState("");
  const problemData = useMemo(() => selectedProblemTitle
    ? problems.find((p) => p.title === selectedProblemTitle)
    : null, [selectedProblemTitle, problems]);

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const codeRef = useRef(code);

  useEffect(() => {
    if (session) {
      if (session.problem && !selectedProblemTitle) setSelectedProblemTitle(session.problem);
      if (session.language && session.language !== selectedLanguage) setSelectedLanguage(session.language);
      if (session.code && session.code !== code) {
        setCode(session.code);
        codeRef.current = session.code;
      }
    }
  }, [session]);

  useEffect(() => {
    if (!streamClient) return;
    const handleErr = () => toast.error("Connection lost. Reconnecting...");
    const handleRec = () => {
      toast.success("Reconnected successfully");
      refetch();
    };
    streamClient.on("connection.error", handleErr);
    streamClient.on("connection.recovered", handleRec);
    return () => {
      streamClient.off("connection.error", handleErr);
      streamClient.off("connection.recovered", handleRec);
    };
  }, [streamClient, refetch]);

  // HR Side: listen for candidate join requests
  const [joinRequests, setJoinRequests] = useState([]);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    
    if (session && isHost) {
      socket.emit("join_session_room", session._id);
    }

    const handleCandidateRequest = ({ candidateName, socketId }) => {
      setJoinRequests((prev) => [...prev, { candidateName, socketId }]);
      toast(`${candidateName} wants to join`, { icon: '👋' });
    };

    socket.on("candidate_request", handleCandidateRequest);

    return () => {
      socket.off("candidate_request", handleCandidateRequest);
    };
  }, [session, isHost]);

  const handleJoinResponse = (candidateSocketId, action) => {
    socket.emit("hr_response", { candidateSocketId, action });
    setJoinRequests((prev) => prev.filter(req => req.socketId !== candidateSocketId));
    if (action === "accept") toast.success("Approved! Candidate is joining...");
  };

  // auto-join session if user is not already a participant and not the host
  useEffect(() => {
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;

    joinSessionMutation.mutate(id, { onSuccess: refetch });

    // remove the joinSessionMutation, refetch from dependencies to avoid infinite loop
  }, [session, user, loadingSession, isHost, isParticipant, id]);

  // host-side: listen for proctoring violation events from candidate
  useEffect(() => {
    if (!channel || !isHost) return;
    const handler = (event) => {
      if (event.user?.id === user?.id) return;
      // AI alerts are separate from the fullscreen/tab violation counter
      if (event.ai) {
        setHostAiAlerts((prev) => {
          const next = [event.description, ...prev].slice(0, 10);
          return next;
        });
        toast.error(`🤖 AI: ${event.description}`, { duration: 5000 });
      } else {
        setHostViolationCount(event.violationCount || 0);
        toast.error(
          `🚨 Candidate violation #${event.violationCount}: ${event.description}`,
          { duration: 5000 }
        );
      }
    };
    channel.on("proctoring_violation", handler);
    return () => channel.off("proctoring_violation", handler);
  }, [channel, isHost, user?.id]);

  // redirect the "participant" when session ends
  useEffect(() => {
    if (!session || loadingSession) return;

    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);

  // update code when problem loads or changes
  useEffect(() => {
    if (problemData?.starterCode?.[selectedLanguage]) {
      setCode(problemData.starterCode[selectedLanguage]);
    }
  }, [problemData, selectedLanguage]);

  const handleLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    const newCode = problemData?.starterCode?.[newLang] || "";
    setCode(newCode);
    codeRef.current = newCode;
    setTestResults(null);
    updateSessionMutation.mutate({ id, data: { language: newLang, code: newCode } });
  }, [problemData, id]);

  const handleProblemChange = useCallback((e) => {
    const title = e.target.value;
    setSelectedProblemTitle(title);
    const p = problems.find((prob) => prob.title === title);
    const newCode = p?.starterCode?.[selectedLanguage] || "";
    setCode(newCode);
    codeRef.current = newCode;
    setTestResults(null);

    updateSessionMutation.mutate({ id, data: { problem: title, code: newCode, language: selectedLanguage } });

    if (call) {
      call.sendCustomEvent({
        type: "problem-selected",
        data: { problemId: p?.id, title, description: p?.description, difficulty: p?.difficulty }
      }).catch(console.error);
    }
  }, [problems, selectedLanguage, call, id]);

  // --- CODE SYNC: send code/language/problem to other participant (debounced) ---
  const sendCodeUpdate = useMemo(
    () =>
      debounce((newCode, lang) => {
        if (!call) return;
        setSyncing(true);
        call.sendCustomEvent({
          type: "code-change",
          data: { code: newCode, language: lang },
        })
          .then(() => setSyncing(false))
          .catch(() => setSyncing(false));
        updateSessionMutation.mutate({ id, data: { code: newCode, language: lang } });
      }, 1000),
    [call, id]
  );

  const onCodeChange = useCallback((value) => {
    setCode(value);
    codeRef.current = value;
    sendCodeUpdate(value, selectedLanguage);

    if (call) {
      call.sendCustomEvent({ type: "typing", data: { userId: user?.id } }).catch(console.error);
    }
  }, [sendCodeUpdate, selectedLanguage, call, user?.id]);

  // --- CUSTOM EVENTS: receive updates from other participant ---
  useEffect(() => {
    if (!call) return;
    const handler = (event) => {
      if (event.user?.id === user?.id) return;
      const customEvent = event.custom || event;

      if (customEvent.type === "problem-selected") {
        setSelectedProblemTitle(customEvent.data.title);
      } else if (customEvent.type === "code-change") {
        isRemoteUpdate.current = true;
        if (customEvent.data.code !== undefined) {
          setCode(customEvent.data.code);
          codeRef.current = customEvent.data.code;
        }
        if (customEvent.data.language) setSelectedLanguage(customEvent.data.language);
      } else if (customEvent.type === "code-result") {
        setTestResults(customEvent.data);
      } else if (customEvent.type === "typing") {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    };
    call.on("custom", handler);
    return () => call.off("custom", handler);
  }, [call, user?.id]);

  const handleRunCode = useCallback(async () => {
    if (!problemData) return;
    setIsRunning(true);
    setTestResults(null);

    try {
      const data = await codeApi.runCode({
        code: codeRef.current,
        language: selectedLanguage,
        problemId: problemData.id,
        runType: "run"
      });
      setTestResults(data);

      if (call) {
        call.sendCustomEvent({
          type: "code-result",
          data
        }).catch(console.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to run code");
    } finally {
      setIsRunning(false);
    }
  }, [selectedLanguage, problemData, call]);

  const handleSubmitCode = useCallback(async () => {
    if (!problemData) return;
    setIsSubmitting(true);
    setTestResults(null);

    try {
      const data = await codeApi.runCode({
        code: codeRef.current,
        language: selectedLanguage,
        problemId: problemData.id,
        runType: "submit"
      });
      setTestResults(data);

      if (call) {
        call.sendCustomEvent({
          type: "code-result",
          data
        }).catch(console.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit code");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLanguage, problemData, call]);

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/interview/join/${session?.uniqueToken}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied! Send this to your candidate.");
  };

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      // this will navigate the HOST to dashboard
      endSessionMutation.mutate(id, { onSuccess: () => navigate("/dashboard") });
    }
  };

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      {/* ── Fullscreen Blocking Overlay for Candidate ── */}
      {isCandidate && session?.status === "active" && !fullscreenActive && (
        <div className="fixed inset-0 z-[9999] bg-base-300/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-base-100 p-8 rounded-3xl shadow-2xl border border-base-200">
            <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MaximizeIcon className="w-10 h-10 text-warning" />
            </div>
            <h2 className="text-2xl font-black mb-3">Fullscreen Required</h2>
            <p className="text-base-content/70 mb-8 leading-relaxed">
              To maintain interview integrity, you must be in fullscreen mode to participate in this session. Leaving fullscreen will flag a violation to your interviewer.
            </p>
            <button
              onClick={enterFullscreen}
              className="btn btn-primary btn-lg w-full shadow-lg shadow-primary/30"
            >
              Enter Fullscreen & Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Pending Join Requests (Host) ── */}
      {isHost && joinRequests.length > 0 && (
        <div className="flex flex-col gap-2 px-4 py-3 bg-info/10 border-b border-info/20 text-info">
          {joinRequests.map(req => (
            <div key={req.socketId} className="flex items-center justify-between">
              <span className="font-semibold text-sm">
                👋 {req.candidateName} is waiting to join the interview.
              </span>
              <div className="flex gap-2">
                <button 
                  className="btn btn-xs btn-success"
                  onClick={() => handleJoinResponse(req.socketId, "accept")}
                >
                  Accept
                </button>
                <button 
                  className="btn btn-xs btn-error"
                  onClick={() => handleJoinResponse(req.socketId, "reject")}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Proctoring Status Bar (Candidate) ── */}
      {isCandidate && session?.status === "active" && (
        <div className={`flex items-center justify-between px-4 py-2 text-sm font-medium border-b ${
          violationCount === 0
            ? "bg-success/10 border-success/20 text-success"
            : "bg-warning/10 border-warning/20 text-warning"
        }`}>
          <div className="flex items-center gap-2">
            {violationCount === 0 ? (
              <ShieldCheckIcon className="w-4 h-4" />
            ) : (
              <ShieldAlertIcon className="w-4 h-4" />
            )}
            <span>
              {violationCount === 0
                ? "Proctoring active — Stay in fullscreen, do not switch tabs"
                : `Warnings: ${violationCount} — Violations are being reported to interviewer`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* AI monitoring badge */}
            <span className={`badge badge-sm gap-1 ${aiReady ? 'badge-info' : 'badge-ghost'}`}>
              <BrainCircuitIcon className="w-3 h-3" />
              {aiReady ? 'AI Monitoring' : 'AI Loading…'}
            </span>
            {cameraCount > 1 && (
              <span className="badge badge-sm badge-warning gap-1">
                <CameraIcon className="w-3 h-3" />
                {cameraCount} cameras
              </span>
            )}
            {!fullscreenActive && (
              <button
                onClick={enterFullscreen}
                className="btn btn-xs btn-warning gap-1"
              >
                <MaximizeIcon className="w-3 h-3" />
                Re-enter Fullscreen
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Proctoring Status Bar (Host) ── */}
      {isHost && session?.status === "active" && (hostViolationCount > 0 || hostAiAlerts.length > 0) && (
        <div className="flex items-center gap-3 px-4 py-2 text-sm font-medium bg-error/10 border-b border-error/20 text-error">
          <AlertTriangleIcon className="w-4 h-4 shrink-0" />
          {hostViolationCount > 0 && (
            <span>Tab/FS violations: {hostViolationCount}</span>
          )}

          {hostAiAlerts.length > 0 && (
            <span className="flex items-center gap-1">
              <BrainCircuitIcon className="w-3.5 h-3.5" />
              AI: {hostAiAlerts[0]}
            </span>
          )}
        </div>
      )}

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          {/* LEFT PANEL - CODE EDITOR & PROBLEM DETAILS */}
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              {/* PROBLEM DSC PANEL */}
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full overflow-y-auto bg-base-200">
                  {/* HEADER SECTION */}
                  <div className="p-6 bg-base-100 border-b border-base-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-base-content">
                          {session?.problem || "Loading..."}
                        </h1>
                        <p className="text-base-content/60 mt-1 text-sm">
                          Host: {session?.host?.name || "Loading..."} •{" "}
                          {session?.participant ? 2 : 1}/2 participants
                        </p>

                        {/* PROBLEM SELECTOR */}
                        <div className="mt-3">
                          {isHost ? (
                            <select
                              className="select select-bordered select-sm w-full max-w-xs"
                              value={selectedProblemTitle}
                              onChange={handleProblemChange}
                            >
                              <option value="">— Pick a coding problem —</option>
                              {problems.map((p) => (
                                <option key={p.id} value={p.title}>
                                  {p.title} ({p.difficulty})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-medium">
                                {problemData?.title || session?.problem || "Waiting for HR to select a problem..."}
                              </span>
                              {(problemData?.difficulty || session?.difficulty) && (
                                <span className={`badge ${getDifficultyBadgeClass(problemData?.difficulty || session?.difficulty)}`}>
                                  {problemData?.difficulty || session?.difficulty}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        {problemData?.category && (
                          <span className="badge badge-outline text-xs">{problemData.category}</span>
                        )}
                        {/* Copy invite link — visible to host when session is not completed */}
                        {isHost && session?.status !== "completed" && (
                          <button
                            onClick={handleCopyLink}
                            className="btn btn-outline btn-sm gap-2"
                            title="Copy session link to share with candidate"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Copy Invite Link
                          </button>
                        )}
                        {isHost && session?.status === "active" && (
                          <button
                            onClick={handleEndSession}
                            disabled={endSessionMutation.isPending}
                            className="btn btn-error btn-sm gap-2"
                          >
                            {endSessionMutation.isPending ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOutIcon className="w-4 h-4" />
                            )}
                            End Session
                          </button>
                        )}
                        {session?.status === "completed" && (
                          <span className="badge badge-ghost badge-lg">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>


                  <ProblemPanel problemData={problemData} />
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    {/* Live sync indicator */}
                    {channel && (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-success/10 border-b border-success/20 text-xs text-success font-medium">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
                        Live Sync — code & output are shared in real-time
                        {syncing && <span className="text-success/70 ml-2 animate-pulse">Syncing...</span>}
                        {isTyping && <span className="text-success/70 ml-2 animate-pulse">Participant is typing...</span>}
                      </div>
                    )}
                    <CodeEditorPanel
                      selectedLanguage={selectedLanguage}
                      code={code}
                      isRunning={isRunning}
                      onLanguageChange={handleLanguageChange}
                      onCodeChange={onCodeChange}
                      onRunCode={handleRunCode}
                      onSubmitCode={handleSubmitCode}
                    />
                  </Panel>

                  <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                  <Panel defaultSize={30} minSize={15}>
                    <TestResultsPanel 
                      results={testResults?.results}
                      totalPassed={testResults?.totalPassed}
                      total={testResults?.total}
                      runType={testResults?.runType}
                      isCompiling={isRunning || isSubmitting}
                    />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* RIGHT PANEL - VIDEO CALLS & CHAT */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-base-200 p-4 overflow-auto">
              {isInitializingCall ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-lg">Connecting to video call...</p>
                  </div>
                </div>
              ) : !streamClient || !call ? (
                <div className="h-full flex items-center justify-center">
                  <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body items-center text-center">
                      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                        <PhoneOffIcon className="w-12 h-12 text-error" />
                      </div>
                      <h2 className="card-title text-2xl">Connection Failed</h2>
                      <p className="text-base-content/70">Unable to connect to the video call</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full relative flex flex-col">
                  <div className="flex-1 min-h-0">
                    <StreamVideo client={streamClient}>
                      <StreamCall call={call}>
                        <VideoCallUI chatClient={chatClient} channel={channel} />
                      </StreamCall>
                    </StreamVideo>
                  </div>
                  
                  {/* Live Transcript Overlay/Bar */}
                  {isTranscribing && (
                    <div className="p-3 bg-base-300 border-t border-base-100 flex gap-3 items-center min-h-[60px]">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                      <div className="flex-1 font-medium text-sm text-base-content/80">
                        {liveTranscript ? (
                          <span className="italic text-base-content">"{liveTranscript}"</span>
                        ) : (
                          <span className="opacity-50">Listening for speech...</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default SessionPage;