import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser, SignIn } from "@clerk/clerk-react";
import axiosInstance from "../lib/axios";
import { socket } from "../lib/socket";
import { Loader2Icon, ShieldCheckIcon, AlertCircleIcon, UserIcon } from "lucide-react";
import toast from "react-hot-toast";

function JoinSessionPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("verifying"); // verifying, requesting, waiting, accepted, rejected

  // Verify token
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axiosInstance.get(`/sessions/verify/${token}`);
        setSession(response.data.session);
        setStatus("ready");
      } catch (err) {
        setError(err.response?.data?.message || "Invalid or expired join link");
        setStatus("error");
      }
    };
    verifyToken();
  }, [token]);

  // Handle socket events for approval flow
  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("join_response", ({ action }) => {
      if (action === "accept") {
        setStatus("accepted");
        toast.success("Request approved! Joining session...");
        setTimeout(() => navigate(`/session/${session._id}`), 1500);
      } else {
        setStatus("rejected");
        toast.error("Your request to join was declined by the host.");
      }
    });

    return () => {
      socket.off("join_response");
    };
  }, [navigate, session]);

  const handleRequestJoin = () => {
    if (!session || !user) return;
    setStatus("requesting");
    
    // Join the socket room for this session (so we can receive responses)
    // Wait, the host is in the room. The candidate can just connect and listen to their own socket.id.
    // The server emits back to candidateSocketId.
    socket.emit("request_to_join", {
      sessionId: session._id,
      candidateName: user.fullName || user.firstName || "Candidate",
    });
    
    setStatus("waiting");
  };

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="size-10 animate-spin text-primary" />
          <p className="text-xl font-semibold">Verifying your invite link...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 shadow-xl max-w-md w-full p-8 text-center">
          <AlertCircleIcon className="size-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
          <p className="text-base-content/70">{error}</p>
        </div>
      </div>
    );
  }

  // If not signed in, show clerk sign in with redirect back here
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Almost there!</h1>
          <p className="text-base-content/70">Please sign in or create an account to join the interview.</p>
        </div>
        <SignIn routing="hash" forceRedirectUrl={`/interview/join/${token}`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4">
      <div className="card bg-base-100 shadow-xl max-w-md w-full border-t-4 border-primary">
        <div className="card-body">
          <div className="flex items-center gap-4 mb-6">
            <div className="avatar">
              <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                {session.host?.profileImage ? (
                  <img src={session.host.profileImage} alt={session.host.name} />
                ) : (
                  <UserIcon className="size-8 text-base-content/50" />
                )}
              </div>
            </div>
            <div>
              <h2 className="card-title text-xl">{session.problem}</h2>
              <p className="text-sm text-base-content/60">Hosted by {session.host?.name}</p>
            </div>
          </div>

          <div className="divider my-0"></div>

          <div className="py-4">
            {status === "ready" && (
              <div className="text-center">
                <ShieldCheckIcon className="size-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Ready to join?</h3>
                <p className="text-sm text-base-content/70 mb-6">
                  Click below to ask the host to let you into the interview room.
                </p>
                <button 
                  className="btn btn-primary w-full shadow-lg"
                  onClick={handleRequestJoin}
                >
                  Request to Join
                </button>
              </div>
            )}

            {status === "waiting" && (
              <div className="text-center py-6">
                <Loader2Icon className="size-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Waiting for host...</h3>
                <p className="text-sm text-base-content/70">
                  We've notified the host. Please wait while they let you in.
                </p>
              </div>
            )}

            {status === "accepted" && (
              <div className="text-center py-6">
                <div className="size-12 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="size-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Request Approved!</h3>
                <p className="text-sm text-base-content/70">
                  Taking you to the interview room...
                </p>
              </div>
            )}

            {status === "rejected" && (
              <div className="text-center py-6">
                <div className="size-12 bg-error/20 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircleIcon className="size-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-error">Request Declined</h3>
                <p className="text-sm text-base-content/70">
                  The host has declined your request to join this session.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinSessionPage;
