import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Users, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InvitationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  ghostUser: {
    id: string;
    name: string;
    email: string;
    company: string;
    title: string;
  };
  targetUser: {
    id: string;
    name: string;
    company: string;
  };
  requesterId: string;
  pathData?: any;
}

export function InvitationFlow({
  isOpen,
  onClose,
  ghostUser,
  targetUser,
  requesterId,
  pathData
}: InvitationFlowProps) {
  const [step, setStep] = useState<'preview' | 'sending' | 'sent'>('preview');
  const [customMessage, setCustomMessage] = useState('');
  const { toast } = useToast();

  const defaultMessage = `Hi ${ghostUser.name},

${targetUser.name} would love a warm introduction to someone at ${targetUser.company}. 

You've been identified as a potential connection in their professional network. Activate your free WarmConnector profile to help facilitate this introduction and unlock your own networking opportunities.

Best regards,
The WarmConnector Team`;

  const handleSendInvitation = async () => {
    try {
      setStep('sending');
      
      const response = await apiRequest('/api/request-intro', {
        method: 'POST',
        body: JSON.stringify({
          ghostUserId: ghostUser.id,
          requesterId,
          targetId: targetUser.id,
          pathData,
          customMessage: customMessage || defaultMessage
        })
      });

      if (response.success) {
        setStep('sent');
        toast({
          title: "Invitation Sent",
          description: `Invitation sent to ${ghostUser.name} at ${ghostUser.email}`,
        });
      } else {
        throw new Error(response.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
      setStep('preview');
    }
  };

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Users className="h-5 w-5 text-blue-600 mt-1" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Connection Request</h4>
          <p className="text-sm text-muted-foreground mt-1">
            You're requesting an introduction to <strong>{targetUser.name}</strong> via <strong>{ghostUser.name}</strong>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email-preview">Invitation will be sent to:</Label>
          <Input 
            id="email-preview"
            value={`${ghostUser.name} <${ghostUser.email}>`}
            disabled
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="message">Custom Message (Optional)</Label>
          <Textarea
            id="message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={defaultMessage}
            className="mt-1 min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave blank to use the default message template
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSendInvitation} className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Send Invitation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderSendingStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-muted-foreground">Sending invitation...</p>
    </div>
  );

  const renderSentStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <CheckCircle className="h-12 w-12 text-green-600" />
      <div className="text-center">
        <h4 className="font-semibold">Invitation Sent!</h4>
        <p className="text-sm text-muted-foreground mt-2">
          {ghostUser.name} will receive an email at {ghostUser.email} with instructions to activate their profile.
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          You'll be notified when they accept the invitation.
        </p>
      </div>
      <Button onClick={onClose} className="mt-6">
        Close
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {step === 'preview' && 'Send Invitation'}
            {step === 'sending' && 'Sending Invitation'}
            {step === 'sent' && 'Invitation Sent'}
          </DialogTitle>
        </DialogHeader>

        {step === 'preview' && renderPreviewStep()}
        {step === 'sending' && renderSendingStep()}
        {step === 'sent' && renderSentStep()}
      </DialogContent>
    </Dialog>
  );
}