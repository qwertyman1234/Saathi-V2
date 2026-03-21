import { useState } from "react";
import { useAdminPlans, type InsurancePlan } from "@/hooks/useAdminPlans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function ManagePlans() {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useAdminPlans();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<InsurancePlan>>({
    name: "",
    provider: "",
    premium: 0,
    coverage: 0,
    maxAge: 65,
    minAge: 18,
    claimSettlementDays: 7,
    rating: 4.5,
    features: [],
    badges: [],
    description: "",
  });

  const handleAddClick = () => {
    setFormData({
      name: "",
      provider: "",
      premium: 0,
      coverage: 0,
      maxAge: 65,
      minAge: 18,
      claimSettlementDays: 7,
      rating: 4.5,
      features: [],
      badges: [],
      description: "",
    });
    setEditingPlan(null);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (plan: InsurancePlan) => {
    setFormData(plan);
    setEditingPlan(plan);
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.provider) {
      toast.error("Name and provider are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPlan) {
        const result = await updatePlan(editingPlan.id, formData);
        if (result.success) {
          toast.success("Plan updated successfully");
          setIsEditDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to update plan");
        }
      } else {
        const result = await createPlan(formData as Omit<InsurancePlan, "id" | "createdAt" | "updatedAt">);
        if (result.success) {
          toast.success("Plan created successfully");
          setIsAddDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to create plan");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlanId) return;

    setIsSubmitting(true);
    try {
      const result = await deletePlan(deletingPlanId);
      if (result.success) {
        toast.success("Plan deleted successfully");
        setDeletingPlanId(null);
      } else {
        toast.error(result.error || "Failed to delete plan");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Insurance Plans</h1>
          <p className="text-muted-foreground">Manage insurance plan catalog and pricing</p>
        </div>
        <Button onClick={handleAddClick} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Plans</CardTitle>
          <CardDescription>Total: {plans.length} plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead className="text-right">Coverage</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No plans yet. Click "Add Plan" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{plan.provider}</TableCell>
                      <TableCell className="text-right">₹{plan.premium?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{(plan.coverage / 100000).toFixed(1)}L</TableCell>
                      <TableCell className="text-right">{plan.rating}★</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingPlanId(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Add New Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update the plan details below" : "Fill in the details to create a new insurance plan"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Name*</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Health Cover"
              />
            </div>

            <div>
              <Label htmlFor="provider">Provider*</Label>
              <Input
                id="provider"
                value={formData.provider || ""}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., Max Healthcare"
              />
            </div>

            <div>
              <Label htmlFor="premium">Premium (₹)</Label>
              <Input
                id="premium"
                type="number"
                value={formData.premium || 0}
                onChange={(e) => setFormData({ ...formData, premium: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="coverage">Coverage (₹)</Label>
              <Input
                id="coverage"
                type="number"
                value={formData.coverage || 0}
                onChange={(e) => setFormData({ ...formData, coverage: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="minAge">Min Age</Label>
              <Input
                id="minAge"
                type="number"
                value={formData.minAge || 18}
                onChange={(e) => setFormData({ ...formData, minAge: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="maxAge">Max Age</Label>
              <Input
                id="maxAge"
                type="number"
                value={formData.maxAge || 65}
                onChange={(e) => setFormData({ ...formData, maxAge: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating || 4.5}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="settlementDays">Claim Settlement Days</Label>
              <Input
                id="settlementDays"
                type="number"
                value={formData.claimSettlementDays || 7}
                onChange={(e) => setFormData({ ...formData, claimSettlementDays: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Textarea
                id="features"
                value={(formData.features || []).join(", ")}
                onChange={(e) => setFormData({ ...formData, features: e.target.value.split(",").map(f => f.trim()) })}
                placeholder="e.g., Pre-existing coverage, Family floater, Cashless claim"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="badges">Badges (comma-separated)</Label>
              <Input
                id="badges"
                value={(formData.badges || []).join(", ")}
                onChange={(e) => setFormData({ ...formData, badges: e.target.value.split(",").map(b => b.trim()) })}
                placeholder="e.g., Best Value, Top Rated"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPlanId} onOpenChange={(open) => {
        if (!open) setDeletingPlanId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
