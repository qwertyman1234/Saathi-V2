import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AccountSettings() {
  const { user: currentUser } = useAuth();
  const auth = getAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<"password" | "reset-email">("reset-email");
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordReset = async () => {
    if (!currentUser?.email) {
      toast.error("Unable to identify your email");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error(error?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");

    if (!currentPassword.trim()) {
      setPasswordError("Current password is required");
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError("New password is required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setIsLoading(true);
    try {
      if (!currentUser?.email || !auth.currentUser) {
        throw new Error("Unable to authenticate");
      }

      // First reauthenticate with current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Then update to new password
      await updatePassword(auth.currentUser, newPassword);

      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password update error:", error);

      if (error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
        setPasswordError("Current password is incorrect");
      } else if (error?.code === "auth/weak-password") {
        setPasswordError("Password is too weak. Use at least 6 characters");
      } else if (error?.code === "auth/requires-recent-login") {
        setPasswordError("Please sign out and sign back in, then try again");
      } else {
        setPasswordError(error?.message || "Failed to update password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your admin account security</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{currentUser?.email || "Not available"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Password Management
          </CardTitle>
          <CardDescription>
            Manage your login password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selection */}
          <div className="flex gap-4">
            <button
              onClick={() => setMethod("reset-email")}
              className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                method === "reset-email"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <p className="font-medium text-sm">Reset via Email</p>
              <p className="text-xs text-muted-foreground mt-1">Get a reset link sent to your email</p>
            </button>
            <button
              onClick={() => setMethod("password")}
              className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                method === "password"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <p className="font-medium text-sm">Change Password</p>
              <p className="text-xs text-muted-foreground mt-1">Update your password directly</p>
            </button>
          </div>

          {/* Reset via Email Method */}
          {method === "reset-email" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  We'll send a password reset link to <strong>{currentUser?.email}</strong>. 
                  Follow the link to set a new password.
                </p>
              </div>
              <Button
                onClick={handlePasswordReset}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Email"
                )}
              </Button>
            </div>
          )}

          {/* Direct Password Change Method */}
          {method === "password" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  If you don't have a password set yet, use <strong>Reset via Email</strong> instead.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter your current password"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Enter a new password (min. 6 characters)"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Confirm your new password"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      handlePasswordChange();
                    }
                  }}
                />
              </div>

              {passwordError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{passwordError}</p>
                </div>
              )}

              <Button
                onClick={handlePasswordChange}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Security Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Use a strong, unique password with uppercase, lowercase, numbers, and symbols</li>
            <li>✓ Never share your password with anyone</li>
            <li>✓ Change your password regularly</li>
            <li>✓ Sign out when using shared devices</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
