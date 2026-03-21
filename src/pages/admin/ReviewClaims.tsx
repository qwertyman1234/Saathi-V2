import { useState } from "react";
import { useAdminClaims } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewClaims() {
  const { claims, loading, updateClaim } = useAdminClaims();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedClaim, setSelectedClaim] = useState<typeof claims[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reminds, setRemarks] = useState("");
  const [newStatus, setNewStatus] = useState<"approved" | "rejected">("approved");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.procedure.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.hospital.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || claim.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (claim: typeof claims[0]) => {
    setSelectedClaim(claim);
    setRemarks(claim.remarks || "");
    setNewStatus(claim.status === "pending" ? "approved" : claim.status);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedClaim) return;

    setIsSubmitting(true);
    try {
      const result = await updateClaim(selectedClaim.id, {
        status: newStatus,
        remarks: reminds,
        updatedAt: new Date(),
      });
      if (result.success) {
        toast.success(`Claim ${newStatus} successfully`);
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to update claim");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = claims.filter(c => c.status === "pending").length;
  const approvedCount = claims.filter(c => c.status === "approved").length;
  const rejectedCount = claims.filter(c => c.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Claims Review</h1>
        <p className="text-muted-foreground">Review and manage insurance claims</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Pending Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, procedure, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Claims</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
          <CardDescription>
            Showing {filteredClaims.length} of {claims.length} claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {searchQuery || filterStatus !== "all"
                        ? "No claims match your filters."
                        : "No claims found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.userName}</TableCell>
                      <TableCell>{claim.procedure}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{claim.hospital}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{claim.claimAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          claim.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : claim.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(claim)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Review Claim</DialogTitle>
            <DialogDescription>
              Update the claim status and add remarks if needed
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">User</Label>
                  <p className="font-semibold">{selectedClaim.userName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Procedure</Label>
                  <p className="font-semibold">{selectedClaim.procedure}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hospital</Label>
                  <p className="font-semibold">{selectedClaim.hospital}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <p className="font-semibold">₹{selectedClaim.claimAmount?.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="status">Decision</Label>
                <Select value={newStatus} onValueChange={(val: any) => setNewStatus(val)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={reminds}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any notes or reasons for this decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
