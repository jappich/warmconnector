import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ghost, Mail, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GhostProfileBadgeProps {
  isGhost: boolean;
  ghostSource?: string;
  trustScore?: number;
  onInvite?: () => void;
  showInviteButton?: boolean;
}

export function GhostProfileBadge({ 
  isGhost, 
  ghostSource, 
  trustScore, 
  onInvite, 
  showInviteButton = false 
}: GhostProfileBadgeProps) {
  if (!isGhost) return null;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <Ghost className="h-3 w-3" />
              Ghost Profile
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>This person hasn't joined WarmConnector yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Source: {ghostSource || 'Unknown'} | Trust: {trustScore || 60}%
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showInviteButton && onInvite && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onInvite}
                className="h-6 px-2 text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                Invite
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Send an invitation to activate this profile
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export function CompanyEnrichmentStats({ 
  realProfiles, 
  ghostProfiles, 
  enrichmentSource 
}: {
  realProfiles: number;
  ghostProfiles: number; 
  enrichmentSource?: string;
}) {
  const total = realProfiles + ghostProfiles;
  const ghostPercentage = total > 0 ? Math.round((ghostProfiles / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-purple-600" />
        <div>
          <div className="font-semibold text-sm">
            Employees in Network: {realProfiles} real / {ghostProfiles} ghost
          </div>
          <div className="text-xs text-muted-foreground">
            {enrichmentSource && `Enriched via ${enrichmentSource}`} • {ghostPercentage}% ghost profiles
          </div>
        </div>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Ghost className="h-3 w-3 mr-1" />
              {ghostPercentage}% Ghost
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ghost profiles are created from company data enrichment</p>
            <p className="text-xs">Inviting them activates full profiles</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}