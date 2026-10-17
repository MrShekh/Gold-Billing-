"use client";
import { useEffect, useState } from "react";
import { Download, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Install app" card shown in Settings.
 *  - Android/Chrome: uses the native install prompt when available.
 *  - iPhone/Safari: shows Add to Home Screen instructions (iOS has no prompt API).
 *  - Hidden once the app is running installed (standalone).
 */
export default function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(true); // hide until detected

  useEffect(() => {
    const ua = navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) {
    return (
      <div className="form-card settings-card no-print" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
          Install Gold Billing
        </h3>
        <p style={{ fontSize: 13, color: "var(--success)", display: "flex", alignItems: "center", gap: 6, margin: 0, fontWeight: 600 }}>
          ✓ Gold Billing is currently running as an installed application.
        </p>
      </div>
    );
  }

  return (
    <div className="form-card settings-card no-print" style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
        Install Gold Billing
      </h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
        Add Gold Billing to your phone or desktop home screen to open it full screen like an app.
      </p>
      {deferred ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
          }}
        >
          <Download size={15} /> Install app
        </button>
      ) : isIOS ? (
        <ol style={{ fontSize: 13, color: "var(--text-secondary)", paddingLeft: 18, lineHeight: 1.9, margin: 0 }}>
          <li>
            Open this page in <strong>Safari</strong>.
          </li>
          <li>
            Tap the Share button <Share size={13} style={{ verticalAlign: "-2px" }} />.
          </li>
          <li>
            Choose <strong>Add to Home Screen</strong> <PlusSquare size={13} style={{ verticalAlign: "-2px" }} />, then tap Add.
          </li>
        </ol>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          💡 To install: tap your browser menu (<strong>⋮</strong> or <strong>Share</strong>) and select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
        </p>
      )}
    </div>
  );
}
