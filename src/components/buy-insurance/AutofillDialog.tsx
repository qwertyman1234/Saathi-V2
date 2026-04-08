import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useVault, FamilyMember } from '@/contexts/VaultContext';
import { format } from 'date-fns';
import { User, Calendar, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AutofillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMember: (member: FamilyMember, data: any) => void;
}

export function AutofillDialog({ open, onOpenChange, onSelectMember }: AutofillDialogProps) {
  const vault = useVault();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelectMember = (member: FamilyMember) => {
    // Prepare autofill data from extracted data
    const autofillData = {
      firstName: member.fullName?.split(' ')[0] || '',
      lastName: member.fullName?.split(' ').slice(1).join(' ') || '',
      email: member.email || '',
      phone: member.mobileNumber || '',
      dateOfBirth: member.dateOfBirth || '',
      gender: member.gender || '',
      // Add more fields from extracted data if available
      ...(member.extractedData?.standardizedData || {})
    };

    onSelectMember(member, autofillData);
    onOpenChange(false);
  };

  const handleDeleteMember = (member: FamilyMember) => {
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      vault.removeFamilyMember(memberToDelete.id);
      toast.success(`${memberToDelete.fullName} deleted from vault`);
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Family Member to Autofill</DialogTitle>
            <DialogDescription>
              Choose a family member whose extracted data will be used to autofill the form
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {vault.familyMembers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  No family members found in vault
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload and process documents to add family members
                </p>
              </div>
            ) : (
              vault.familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="w-full p-4 rounded-lg border-2 border-muted hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {member.fullName}
                        {member.relation && (
                          <Badge variant="outline" className="text-xs">
                            {member.relation}
                          </Badge>
                        )}
                      </div>
                      
                      {member.dateOfBirth && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            DOB: {format(new Date(member.dateOfBirth), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}

                      {member.email && (
                        <div className="text-xs text-muted-foreground mt-1">
                          📧 {member.email}
                        </div>
                      )}

                      {member.mobileNumber && (
                        <div className="text-xs text-muted-foreground">
                          📱 {member.mobileNumber}
                        </div>
                      )}

                      {member.extractedData && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Data extracted from documents</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSelectMember(member)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Use This
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMember(member)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToDelete?.fullName}</strong> and all their extracted data from the vault? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
