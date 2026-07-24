import { useParams, useNavigate } from "react-router";
import { useSessionById } from "../hooks/useSessions";
import { formatDistanceToNow } from "date-fns";
import Navbar from "../components/Navbar";
import { ShieldAlertIcon, ShieldCheckIcon, Code2Icon, BrainCircuitIcon, UserIcon, CheckCircleIcon } from "lucide-react";
import { getDifficultyBadgeClass } from "../lib/utils";

export default function EvaluationDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sessionData, isLoading } = useSessionById(id);

  if (isLoading) {
    return (
      <div className="h-screen bg-base-100 flex flex-col items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/60">Loading evaluation report...</p>
      </div>
    );
  }

  const session = sessionData?.session;
  if (!session) {
    return (
      <div className="h-screen bg-base-100 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-error">Session not found</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate("/dashboard")}>Return Home</button>
      </div>
    );
  }

  const violations = session.violations || [];
  const transcript = session.transcript || [];
  
  return (
    <div className="min-h-screen bg-base-100 flex flex-col pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 mt-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200 p-6 rounded-2xl border border-base-300">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <span className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                Evaluation Report
              </span>
              <span className={`badge ${getDifficultyBadgeClass(session.difficulty)}`}>{session.difficulty}</span>
            </h1>
            <p className="text-base-content/60 mt-2 font-medium">
              Problem: <span className="text-base-content">{session.problem}</span>
            </p>
            <p className="text-base-content/60 text-sm mt-1">
              Completed {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center p-3 bg-base-100 rounded-xl border border-base-300">
              <p className="text-xs font-bold opacity-60 uppercase mb-1">Host</p>
              <div className="flex items-center gap-2">
                <img src={session.host?.profileImage} alt="" className="w-6 h-6 rounded-full" />
                <span className="font-semibold">{session.host?.name}</span>
              </div>
            </div>
            {session.participant && (
              <div className="text-center p-3 bg-base-100 rounded-xl border border-base-300">
                <p className="text-xs font-bold opacity-60 uppercase mb-1">Candidate</p>
                <div className="flex items-center gap-2">
                  <img src={session.participant?.profileImage} alt="" className="w-6 h-6 rounded-full" />
                  <span className="font-semibold">{session.participant?.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT - CODE & TRANSCRIPT */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Final Code */}
            <div className="card bg-base-200 border border-base-300 shadow-sm">
              <div className="card-body p-6">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Code2Icon className="w-5 h-5 text-primary" />
                  Final Submitted Code
                </h2>
                <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-300 font-mono">
                    <code>{session.code || "// No code was written"}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div className="card bg-base-200 border border-base-300 shadow-sm">
              <div className="card-body p-6">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <BrainCircuitIcon className="w-5 h-5 text-secondary" />
                  Interview Transcript
                </h2>
                {transcript.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {transcript.map((msg, idx) => (
                      <div key={idx} className={`chat ${msg.speaker === "host" ? "chat-start" : "chat-end"}`}>
                        <div className="chat-image avatar">
                          <div className="w-8 rounded-full">
                            <img src={msg.speaker === "host" ? session.host?.profileImage : (session.participant?.profileImage || "https://api.dicebear.com/7.x/avataaars/svg")} alt="" />
                          </div>
                        </div>
                        <div className="chat-header text-xs opacity-50 mb-1">
                          {msg.speaker === "host" ? session.host?.name : (session.participant?.name || "Candidate")}
                          <time className="text-xs opacity-50 ml-2">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                        </div>
                        <div className={`chat-bubble ${msg.speaker === "host" ? "chat-bubble-primary" : "chat-bubble-secondary"}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-50">
                    <p>No audio transcript recorded for this session.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR - PROCTORING REPORT */}
          <div className="space-y-8">
            <div className="card bg-base-200 border border-base-300 shadow-sm">
              <div className="card-body p-6">
                <h2 className="text-xl font-bold mb-6">Proctoring Report</h2>
                
                {violations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-success bg-success/10 rounded-xl border border-success/20">
                    <ShieldCheckIcon className="w-12 h-12 mb-3" />
                    <h3 className="font-bold text-lg">Clean Interview</h3>
                    <p className="text-sm text-center px-4">No violations or suspicious behavior detected during the session.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center py-6 text-error bg-error/10 rounded-xl border border-error/20">
                      <ShieldAlertIcon className="w-10 h-10 mb-2" />
                      <h3 className="font-bold text-lg">{violations.length} Violations Detected</h3>
                    </div>

                    <div className="relative border-l-2 border-base-300 ml-3 space-y-6 pb-4">
                      {violations.map((v, idx) => (
                        <div key={idx} className="relative pl-6">
                          <div className="absolute w-3 h-3 bg-error rounded-full -left-[7px] top-1.5 ring-4 ring-base-200" />
                          <div className="text-sm font-bold text-base-content">{v.description}</div>
                          <div className="text-xs text-base-content/60 font-mono mt-1">
                            {new Date(v.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
