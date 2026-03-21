import { useState } from "react";
import { useAdminUsers } from "@/hooks/useAdminData";
import { useAuth } from "@/contexts/AuthContext";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Mail, Phone, User, Edit2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { AdminUserProfile } from "@/hooks/useAdminData";

export default function ManageUsers() {
  const { users, loading, updateUser, deleteUser } = useAdminUsers();
  const { user: currentUser } = useAuth();
  const auth = getAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Admin role promotion state
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "user" as "admin" | "employee" | "user",
  });

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  const handleEditClick = (user: AdminUserProfile) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleRoleChange = (newRole: "admin" | "employee" | "user") => {
    // If changing TO admin, require password confirmation
    if (newRole === "admin" && editFormData.role !== "admin") {
      setShowAdminPrompt(true);
      setAdminPassword("");
      setAdminPasswordError("");
    } else {
      setEditFormData({ ...editFormData, role: newRole });
    }
  };

  const verifyAdminPassword = async () => {
    setAdminPasswordError("");
    
    if (!adminPassword.trim()) {
      setAdminPasswordError("Password is required");
      return;
    }

    if (!currentUser?.email) {
      setAdminPasswordError("Unable to verify your identity");
      return;
    }

    setIsVerifying(true);
    try {
      // Reauthenticate with Firebase to verify password
      const credential = EmailAuthProvider.credential(currentUser.email, adminPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      
      // Password verified - allow admin role assignment
      setEditFormData({ ...editFormData, role: "admin" });
      setShowAdminPrompt(false);
      setAdminPassword("");
      toast.success("Password verified. Admin role will be assigned.");
    } catch (error: any) {
      console.error("Reauthentication error:", error);
      
      if (error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
        setAdminPasswordError("Incorrect password. Please check and try again.");
      } else if (error?.code === "auth/invalid-email") {
        setAdminPasswordError("Invalid email. Please contact support.");
      } else if (error?.code === "auth/user-disabled") {
        setAdminPasswordError("Your account is disabled.");
      } else if (error?.code === "auth/operation-not-allowed") {
        setAdminPasswordError("Email/password authentication is not enabled. Please contact support.");
      } else if (error?.code === "auth/user-not-found") {
        setAdminPasswordError("User not found. Please contact support.");
      } else {
        setAdminPasswordError(error?.message?.includes("auth/") 
          ? "Authentication failed. Ensure you're using your correct login password." 
          : error?.message || "Password verification failed. Please try again."
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const result = await updateUser(editingUser.userId, {
        ...editingUser,
        ...editFormData,
      });
      
      if (result.success) {
        toast.success("User updated successfully");
        setIsEditDialogOpen(false);
        setEditingUser(null);
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsSaving(true);
    try {
      const result = await deleteUser(userId);
      
      if (result.success) {
        toast.success("User deleted successfully");
        setDeletingUserId(null);
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">View, edit, and manage user accounts</p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Total: {users.length} users | Showing: {filteredUsers.length} results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      {searchQuery ? "No users match your search." : "No users found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </TableCell>
                      <TableCell className="text-sm flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {user.phone || "N/A"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-amber-100 text-amber-800"
                            : user.role === "employee"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {user.role === "admin" ? "Admin" : user.role === "employee" ? "Employee" : "User"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          user.onboardingCompleted
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {user.onboardingCompleted ? "Active" : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {user.createdAt && user.createdAt.toDate ? (
                          new Date(user.createdAt.toDate()).toLocaleDateString()
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            className="gap-1"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingUserId(user.userId)}
                            className="gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.onboardingCompleted).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "employee").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "admin").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <Select value={editFormData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUserId && handleDeleteUser(deletingUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Role Promotion - Password Confirmation */}
      <Dialog open={showAdminPrompt} onOpenChange={setShowAdminPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Confirm Admin Role Assignment
            </DialogTitle>
            <DialogDescription>
              To promote this user to Admin, please verify your identity by entering your login password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> You are about to promote <strong>"{editingUser?.fullName}"</strong> to Admin role. 
                This gives them full access to the admin panel. Verify with your password to proceed.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Your Password ({currentUser?.email || "Admin"})
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Enter the password you use to sign into your admin account
              </p>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminPasswordError("");
                }}
                placeholder="e.g., your login password"
                disabled={isVerifying}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isVerifying) {
                    verifyAdminPassword();
                  }
                }}
              />
              {adminPasswordError && (
                <p className="text-xs text-destructive mt-1">{adminPasswordError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAdminPrompt(false);
                setAdminPassword("");
                setAdminPasswordError("");
              }}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button 
              onClick={verifyAdminPassword}
              disabled={isVerifying}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isVerifying ? "Verifying..." : "Verify & Promote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
