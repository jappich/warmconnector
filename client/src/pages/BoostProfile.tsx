import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Building2, 
  Heart,
  Shield,
  Award,
  Globe,
  Phone,
  Lock,
  Info,
  CheckCircle2,
  TrendingUp,
  Zap
} from 'lucide-react';

interface BoostData {
  spouse: { name: string; company: string; email: string };
  relatives: Array<{ relation: string; name: string; company: string; email: string }>;
  executiveAssistant: { name: string; email: string };
  manager: { name: string; email: string; company: string };
  directReports: Array<{ name: string; email: string; company: string }>;
  certifications: string[];
  boardMemberships: string[];
  volunteerRoles: string[];
  languages: string[];
  preferredContact: string;
}

const RELATIONS = ['parent', 'sibling', 'child'];
const CONTACT_METHODS = ['email', 'phone', 'linkedin', 'slack'];
const COMMON_CERTIFICATIONS = [
  'CPA', 'CISSP', 'PMP', 'MBA', 'CFA', 'FRM', 'CISA', 'CISM', 
  'AWS Certified', 'Google Cloud', 'Azure Certified', 'Salesforce Admin'
];
const COMMON_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian'
];

export default function BoostProfile() {
  const [boostData, setBoostData] = useState<BoostData>({
    spouse: { name: '', company: '', email: '' },
    relatives: [],
    executiveAssistant: { name: '', email: '' },
    manager: { name: '', email: '', company: '' },
    directReports: [],
    certifications: [],
    boardMemberships: [],
    volunteerRoles: [],
    languages: [],
    preferredContact: 'email'
  });

  const { toast } = useToast();

  // Calculate completion progress
  const getCompletionCount = () => {
    let count = 0;
    if (boostData.spouse.name) count++;
    if (boostData.relatives.length > 0) count++;
    if (boostData.executiveAssistant.name) count++;
    if (boostData.manager.name) count++;
    if (boostData.directReports.length > 0) count++;
    if (boostData.certifications.length > 0) count++;
    if (boostData.boardMemberships.length > 0) count++;
    if (boostData.volunteerRoles.length > 0) count++;
    if (boostData.languages.length > 0) count++;
    return count;
  };

  const completionCount = getCompletionCount();
  const totalFields = 9;
  const progressPercentage = (completionCount / totalFields) * 100;

  const addRelative = () => {
    setBoostData(prev => ({
      ...prev,
      relatives: [...prev.relatives, { relation: 'sibling', name: '', company: '', email: '' }]
    }));
  };

  const removeRelative = (index: number) => {
    setBoostData(prev => ({
      ...prev,
      relatives: prev.relatives.filter((_, i) => i !== index)
    }));
  };

  const addDirectReport = () => {
    setBoostData(prev => ({
      ...prev,
      directReports: [...prev.directReports, { name: '', email: '', company: '' }]
    }));
  };

  const removeDirectReport = (index: number) => {
    setBoostData(prev => ({
      ...prev,
      directReports: prev.directReports.filter((_, i) => i !== index)
    }));
  };

  const addCertification = (cert: string) => {
    if (!boostData.certifications.includes(cert)) {
      setBoostData(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert]
      }));
    }
  };

  const removeCertification = (cert: string) => {
    setBoostData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  const addLanguage = (lang: string) => {
    if (!boostData.languages.includes(lang)) {
      setBoostData(prev => ({
        ...prev,
        languages: [...prev.languages, lang]
      }));
    }
  };

  const removeLanguage = (lang: string) => {
    setBoostData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/profile/boost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boostData)
      });

      if (response.ok) {
        toast({
          title: "Network Boosted!",
          description: "Your advanced relationship details have been saved and your network graph is updating.",
        });
        // Redirect to dashboard after successful boost
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        throw new Error('Failed to save boost data');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an issue saving your network boost. Please try again.",
        variant: "destructive"
      });
    }
  };

  const skipBoost = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-dark via-cosmic-dark/95 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            <TrendingUp className="inline h-8 w-8 mr-3 text-cosmic-accent" />
            Boost Your Network Strength
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Add high-value relationship details to unlock powerful connection paths (optional)
          </p>
          
          {/* Progress */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-cosmic-text">Network Boost Progress</span>
              <span className="text-sm text-cosmic-accent">{completionCount}/{totalFields} sections</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-cosmic-muted mt-2">
              Each section you complete significantly increases your connection discovery power
            </p>
          </div>
        </div>

        {/* Boost Sections */}
        <Card className="bg-cosmic-card border-cosmic-border mb-8">
          <CardHeader>
            <CardTitle className="text-cosmic-text">Network Relationship Details</CardTitle>
            <CardDescription className="text-cosmic-muted">
              Add relationship details to discover warm introduction paths others can't access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Accordion type="multiple" className="space-y-4">
                
                {/* Family & Spouse */}
                <AccordionItem value="family" className="border border-cosmic-border rounded-lg">
                  <AccordionTrigger className="px-4 text-cosmic-text hover:text-cosmic-accent">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Family & Spouse
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-cosmic-muted" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Family ties can unlock trusted cross-company introductions</p>
                        </TooltipContent>
                      </Tooltip>
                      <Lock className="h-3 w-3 text-cosmic-muted ml-2" />
                      <span className="text-xs text-cosmic-muted">Kept private</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Spouse */}
                      <div>
                        <Label className="text-sm font-medium text-cosmic-text">Spouse/Partner</Label>
                        <div className="grid md:grid-cols-3 gap-2 mt-1">
                          <Input
                            placeholder="Name"
                            value={boostData.spouse.name}
                            onChange={(e) => setBoostData(prev => ({
                              ...prev,
                              spouse: { ...prev.spouse, name: e.target.value }
                            }))}
                            className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                          />
                          <Input
                            placeholder="Company (optional)"
                            value={boostData.spouse.company}
                            onChange={(e) => setBoostData(prev => ({
                              ...prev,
                              spouse: { ...prev.spouse, company: e.target.value }
                            }))}
                            className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                          />
                          <Input
                            placeholder="Email (optional)"
                            type="email"
                            value={boostData.spouse.email}
                            onChange={(e) => setBoostData(prev => ({
                              ...prev,
                              spouse: { ...prev.spouse, email: e.target.value }
                            }))}
                            className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                          />
                        </div>
                      </div>

                      {/* Relatives */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-cosmic-text">Family Members</Label>
                          <Button size="sm" variant="outline" onClick={addRelative} className="border-cosmic-border text-cosmic-text">
                            Add Family Member
                          </Button>
                        </div>
                        {boostData.relatives.map((relative, index) => (
                          <div key={index} className="grid md:grid-cols-4 gap-2 mb-2">
                            <select
                              value={relative.relation}
                              onChange={(e) => {
                                const newRelatives = [...boostData.relatives];
                                newRelatives[index].relation = e.target.value;
                                setBoostData(prev => ({ ...prev, relatives: newRelatives }));
                              }}
                              className="bg-cosmic-dark border border-cosmic-border rounded-md px-3 py-2 text-cosmic-text"
                            >
                              {RELATIONS.map(rel => (
                                <option key={rel} value={rel}>{rel}</option>
                              ))}
                            </select>
                            <Input
                              placeholder="Name"
                              value={relative.name}
                              onChange={(e) => {
                                const newRelatives = [...boostData.relatives];
                                newRelatives[index].name = e.target.value;
                                setBoostData(prev => ({ ...prev, relatives: newRelatives }));
                              }}
                              className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                            />
                            <Input
                              placeholder="Company"
                              value={relative.company}
                              onChange={(e) => {
                                const newRelatives = [...boostData.relatives];
                                newRelatives[index].company = e.target.value;
                                setBoostData(prev => ({ ...prev, relatives: newRelatives }));
                              }}
                              className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                            />
                            <div className="flex gap-1">
                              <Input
                                placeholder="Email"
                                type="email"
                                value={relative.email}
                                onChange={(e) => {
                                  const newRelatives = [...boostData.relatives];
                                  newRelatives[index].email = e.target.value;
                                  setBoostData(prev => ({ ...prev, relatives: newRelatives }));
                                }}
                                className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeRelative(index)}
                                className="border-red-500 text-red-500"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Executive Assistant */}
                <AccordionItem value="assistant" className="border border-cosmic-border rounded-lg">
                  <AccordionTrigger className="px-4 text-cosmic-text hover:text-cosmic-accent">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Executive Assistant
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-cosmic-muted" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>EAs manage 80% of C-suite calendars—adding one triples meeting acceptance</p>
                        </TooltipContent>
                      </Tooltip>
                      <Lock className="h-3 w-3 text-cosmic-muted ml-2" />
                      <span className="text-xs text-cosmic-muted">Kept private</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-cosmic-text">Assistant Name</Label>
                        <Input
                          placeholder="e.g., Sarah Johnson"
                          value={boostData.executiveAssistant.name}
                          onChange={(e) => setBoostData(prev => ({
                            ...prev,
                            executiveAssistant: { ...prev.executiveAssistant, name: e.target.value }
                          }))}
                          className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-cosmic-text">Assistant Email</Label>
                        <Input
                          placeholder="sarah.johnson@company.com"
                          type="email"
                          value={boostData.executiveAssistant.email}
                          onChange={(e) => setBoostData(prev => ({
                            ...prev,
                            executiveAssistant: { ...prev.executiveAssistant, email: e.target.value }
                          }))}
                          className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Reporting Lines */}
                <AccordionItem value="reporting" className="border border-cosmic-border rounded-lg">
                  <AccordionTrigger className="px-4 text-cosmic-text hover:text-cosmic-accent">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Reporting Lines
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-cosmic-muted" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reporting lines create high-trust intros inside large organizations</p>
                        </TooltipContent>
                      </Tooltip>
                      <Lock className="h-3 w-3 text-cosmic-muted ml-2" />
                      <span className="text-xs text-cosmic-muted">Kept private</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Manager */}
                      <div>
                        <Label className="text-sm font-medium text-cosmic-text">Manager</Label>
                        <div className="grid md:grid-cols-3 gap-2 mt-1">
                          <Input
                            placeholder="Manager name"
                            value={boostData.manager.name}
                            onChange={(e) => setBoostData(prev => ({
                              ...prev,
                              manager: { ...prev.manager, name: e.target.value }
                            }))}
                            className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={boostData.manager.email}
                            onChange={(e) => setBoostData(prev => ({
                              ...prev,
                              manager: { ...prev.manager, email: e.target.value }
                            }))}
                            className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                          />
                          <Input
                            placeholder="Company"
                            value={boostData.manager.company}
                            onChange={(e) => setBoostData(prev => ({
                              ...prev,
                              manager: { ...prev.manager, company: e.target.value }
                            }))}
                            className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                          />
                        </div>
                      </div>

                      {/* Direct Reports */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-cosmic-text">Direct Reports</Label>
                          <Button size="sm" variant="outline" onClick={addDirectReport} className="border-cosmic-border text-cosmic-text">
                            Add Direct Report
                          </Button>
                        </div>
                        {boostData.directReports.map((report, index) => (
                          <div key={index} className="grid md:grid-cols-4 gap-2 mb-2">
                            <Input
                              placeholder="Name"
                              value={report.name}
                              onChange={(e) => {
                                const newReports = [...boostData.directReports];
                                newReports[index].name = e.target.value;
                                setBoostData(prev => ({ ...prev, directReports: newReports }));
                              }}
                              className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                            />
                            <Input
                              placeholder="Email"
                              type="email"
                              value={report.email}
                              onChange={(e) => {
                                const newReports = [...boostData.directReports];
                                newReports[index].email = e.target.value;
                                setBoostData(prev => ({ ...prev, directReports: newReports }));
                              }}
                              className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                            />
                            <Input
                              placeholder="Company"
                              value={report.company}
                              onChange={(e) => {
                                const newReports = [...boostData.directReports];
                                newReports[index].company = e.target.value;
                                setBoostData(prev => ({ ...prev, directReports: newReports }));
                              }}
                              className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeDirectReport(index)}
                              className="border-red-500 text-red-500"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Certifications */}
                <AccordionItem value="certifications" className="border border-cosmic-border rounded-lg">
                  <AccordionTrigger className="px-4 text-cosmic-text hover:text-cosmic-accent">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certifications
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-cosmic-muted" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Shared credentials build instant credibility in regulated industries</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {boostData.certifications.map(cert => (
                          <Badge key={cert} variant="secondary" className="bg-cosmic-accent/20 text-cosmic-text">
                            {cert}
                            <button
                              onClick={() => removeCertification(cert)}
                              className="ml-2 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {COMMON_CERTIFICATIONS.filter(cert => !boostData.certifications.includes(cert)).map(cert => (
                          <Button
                            key={cert}
                            size="sm"
                            variant="outline"
                            onClick={() => addCertification(cert)}
                            className="border-cosmic-border text-cosmic-text text-xs"
                          >
                            + {cert}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Board & Volunteer Work */}
                <AccordionItem value="boards" className="border border-cosmic-border rounded-lg">
                  <AccordionTrigger className="px-4 text-cosmic-text hover:text-cosmic-accent">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Boards & Volunteer Work
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-cosmic-muted" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Board members and volunteers cross industry boundaries—great partnership paths</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-cosmic-text">Board Memberships</Label>
                        <Input
                          placeholder="e.g., United Way Board, Tech Startup Advisory Board"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              setBoostData(prev => ({
                                ...prev,
                                boardMemberships: [...prev.boardMemberships, e.currentTarget.value.trim()]
                              }));
                              e.currentTarget.value = '';
                            }
                          }}
                          className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                          {boostData.boardMemberships.map((board, index) => (
                            <Badge key={index} variant="secondary" className="bg-cosmic-accent/20 text-cosmic-text">
                              {board}
                              <button
                                onClick={() => {
                                  setBoostData(prev => ({
                                    ...prev,
                                    boardMemberships: prev.boardMemberships.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="ml-2 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-cosmic-text">Volunteer Roles</Label>
                        <Input
                          placeholder="e.g., Habitat for Humanity, Local Food Bank"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              setBoostData(prev => ({
                                ...prev,
                                volunteerRoles: [...prev.volunteerRoles, e.currentTarget.value.trim()]
                              }));
                              e.currentTarget.value = '';
                            }
                          }}
                          className="bg-cosmic-dark border-cosmic-border text-cosmic-text"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                          {boostData.volunteerRoles.map((role, index) => (
                            <Badge key={index} variant="secondary" className="bg-cosmic-accent/20 text-cosmic-text">
                              {role}
                              <button
                                onClick={() => {
                                  setBoostData(prev => ({
                                    ...prev,
                                    volunteerRoles: prev.volunteerRoles.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="ml-2 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Languages & Contact */}
                <AccordionItem value="languages" className="border border-cosmic-border rounded-lg">
                  <AccordionTrigger className="px-4 text-cosmic-text hover:text-cosmic-accent">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Languages & Contact Preference
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-cosmic-muted" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Shared language helps with global intros and scheduling</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-cosmic-text">Languages Spoken</Label>
                        <div className="flex flex-wrap gap-2 mt-2 mb-3">
                          {boostData.languages.map(lang => (
                            <Badge key={lang} variant="secondary" className="bg-cosmic-accent/20 text-cosmic-text">
                              {lang}
                              <button
                                onClick={() => removeLanguage(lang)}
                                className="ml-2 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {COMMON_LANGUAGES.filter(lang => !boostData.languages.includes(lang)).map(lang => (
                            <Button
                              key={lang}
                              size="sm"
                              variant="outline"
                              onClick={() => addLanguage(lang)}
                              className="border-cosmic-border text-cosmic-text text-xs"
                            >
                              + {lang}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-cosmic-text">Preferred Contact Method</Label>
                        <select
                          value={boostData.preferredContact}
                          onChange={(e) => setBoostData(prev => ({ ...prev, preferredContact: e.target.value }))}
                          className="w-full bg-cosmic-dark border border-cosmic-border rounded-md px-3 py-2 text-cosmic-text mt-1"
                        >
                          {CONTACT_METHODS.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={skipBoost}
            className="border-cosmic-border text-cosmic-text"
          >
            Skip for Now
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-cosmic-primary hover:bg-cosmic-primary/80"
          >
            <Zap className="h-4 w-4 mr-2" />
            Save & Boost My Network
            <CheckCircle2 className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="bg-cosmic-dark/30 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-cosmic-accent" />
              <span className="font-medium text-cosmic-text">Privacy Protected</span>
            </div>
            <p className="text-sm text-cosmic-muted">
              Sensitive relationship data is kept private and used only to find connection paths. 
              Names and emails are never shown publicly in search results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}