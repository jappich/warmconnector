import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Building2, 
  GraduationCap, 
  Users, 
  Heart,
  MapPin,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Plus,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';

interface SocialProfiles {
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  other: string;
}

interface Education {
  school: string;
  degree: string;
  year: number;
}

interface GreekLife {
  org: string;
  chapter: string;
  role: string;
}

interface Family {
  spouse: string;
  children: string[];
  siblings: string[];
}

interface Hometown {
  city: string;
  state: string;
  country: string;
}

export default function Onboarding() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Basic Profile
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');

  // Social Profiles
  const [socialProfiles, setSocialProfiles] = useState<SocialProfiles>({
    linkedin: '',
    facebook: '',
    twitter: '',
    instagram: '',
    other: ''
  });

  // Education
  const [education, setEducation] = useState<Education>({
    school: '',
    degree: '',
    year: new Date().getFullYear()
  });

  // Greek Life
  const [greekLife, setGreekLife] = useState<GreekLife>({
    org: '',
    chapter: '',
    role: ''
  });

  // Family
  const [family, setFamily] = useState<Family>({
    spouse: '',
    children: [''],
    siblings: ['']
  });

  // Hometowns
  const [hometowns, setHometowns] = useState<Hometown[]>([
    { city: '', state: '', country: '' }
  ]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addArrayItem = (array: string[], setArray: (items: string[]) => void) => {
    setArray([...array, '']);
  };

  const removeArrayItem = (array: string[], setArray: (items: string[]) => void, index: number) => {
    if (array.length > 1) {
      setArray(array.filter((_, i) => i !== index));
    }
  };

  const updateArrayItem = (array: string[], setArray: (items: string[]) => void, index: number, value: string) => {
    const newArray = [...array];
    newArray[index] = value;
    setArray(newArray);
  };

  const addHometown = () => {
    setHometowns([...hometowns, { city: '', state: '', country: '' }]);
  };

  const removeHometown = (index: number) => {
    if (hometowns.length > 1) {
      setHometowns(hometowns.filter((_, i) => i !== index));
    }
  };

  const updateHometown = (index: number, field: keyof Hometown, value: string) => {
    const newHometowns = [...hometowns];
    newHometowns[index][field] = value;
    setHometowns(newHometowns);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !company.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in your name, email, and company",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/onboarding/save', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          title: title.trim(),
          bio: bio.trim(),
          socialProfiles,
          education,
          greekLife,
          family,
          hometowns: hometowns.filter(h => h.city.trim() || h.state.trim() || h.country.trim())
        })
      });

      toast({
        title: "Onboarding Complete!",
        description: "Your profile has been saved successfully"
      });

      setLocation('/');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Message */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to WarmConnector</h1>
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-blue-300 mb-2">
              The more connections you provide, the better your results will be!
            </h2>
            <p className="text-blue-200">
              Each piece of information helps us find stronger pathways to your target connections.
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              {currentStep === 1 && <><User className="mr-2 h-5 w-5" />Basic Information</>}
              {currentStep === 2 && <><Linkedin className="mr-2 h-5 w-5" />Social Profiles</>}
              {currentStep === 3 && <><GraduationCap className="mr-2 h-5 w-5" />Education & Greek Life</>}
              {currentStep === 4 && <><Heart className="mr-2 h-5 w-5" />Family</>}
              {currentStep === 5 && <><MapPin className="mr-2 h-5 w-5" />Hometowns</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Full Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Email *</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      type="email"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Company *</Label>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Enter your company name"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Job Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter your job title"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Bio (Optional)</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="bg-gray-900/50 border-gray-600 text-white"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Social Profiles */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300 flex items-center">
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn URL
                    </Label>
                    <Input
                      value={socialProfiles.linkedin}
                      onChange={(e) => setSocialProfiles({...socialProfiles, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/in/yourprofile"
                      type="url"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 flex items-center">
                      <Facebook className="mr-2 h-4 w-4" />
                      Facebook URL
                    </Label>
                    <Input
                      value={socialProfiles.facebook}
                      onChange={(e) => setSocialProfiles({...socialProfiles, facebook: e.target.value})}
                      placeholder="https://facebook.com/yourprofile"
                      type="url"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 flex items-center">
                      <Twitter className="mr-2 h-4 w-4" />
                      Twitter Handle
                    </Label>
                    <Input
                      value={socialProfiles.twitter}
                      onChange={(e) => setSocialProfiles({...socialProfiles, twitter: e.target.value})}
                      placeholder="@yourusername"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 flex items-center">
                      <Instagram className="mr-2 h-4 w-4" />
                      Instagram Handle
                    </Label>
                    <Input
                      value={socialProfiles.instagram}
                      onChange={(e) => setSocialProfiles({...socialProfiles, instagram: e.target.value})}
                      placeholder="@yourusername"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Other Social Profile (Optional)</Label>
                    <Input
                      value={socialProfiles.other}
                      onChange={(e) => setSocialProfiles({...socialProfiles, other: e.target.value})}
                      placeholder="Any other social media profile URL"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Education & Greek Life */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border rounded-lg p-4 bg-gray-900/30">
                  <h3 className="text-lg font-medium text-white mb-4">Education</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">University Name</Label>
                      <Input
                        value={education.school}
                        onChange={(e) => setEducation({...education, school: e.target.value})}
                        placeholder="Enter your university name"
                        className="bg-gray-900/50 border-gray-600 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Degree or Major</Label>
                        <Input
                          value={education.degree}
                          onChange={(e) => setEducation({...education, degree: e.target.value})}
                          placeholder="e.g., Computer Science, MBA"
                          className="bg-gray-900/50 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Graduation Year</Label>
                        <Input
                          value={education.year}
                          onChange={(e) => setEducation({...education, year: parseInt(e.target.value) || new Date().getFullYear()})}
                          type="number"
                          min="1950"
                          max={new Date().getFullYear() + 10}
                          className="bg-gray-900/50 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gray-900/30">
                  <h3 className="text-lg font-medium text-white mb-4">Greek Life (Optional)</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Organization Name</Label>
                      <Input
                        value={greekLife.org}
                        onChange={(e) => setGreekLife({...greekLife, org: e.target.value})}
                        placeholder="e.g., Alpha Phi Alpha, Delta Gamma"
                        className="bg-gray-900/50 border-gray-600 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Chapter</Label>
                        <Input
                          value={greekLife.chapter}
                          onChange={(e) => setGreekLife({...greekLife, chapter: e.target.value})}
                          placeholder="e.g., Beta Chapter, Gamma Xi"
                          className="bg-gray-900/50 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Role / Position</Label>
                        <Input
                          value={greekLife.role}
                          onChange={(e) => setGreekLife({...greekLife, role: e.target.value})}
                          placeholder="e.g., Member, President, Treasurer"
                          className="bg-gray-900/50 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Family */}
            {currentStep === 4 && (
              <div className="border rounded-lg p-4 bg-gray-900/30">
                <h3 className="text-lg font-medium text-white mb-4">Family (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Spouse's Full Name</Label>
                    <Input
                      value={family.spouse}
                      onChange={(e) => setFamily({...family, spouse: e.target.value})}
                      placeholder="Enter your spouse's name"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Children's Names</Label>
                    {family.children.map((child, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Input
                          value={child}
                          onChange={(e) => updateArrayItem(family.children, (items) => setFamily({...family, children: items}), index, e.target.value)}
                          placeholder="Enter child's name"
                          className="bg-gray-900/50 border-gray-600 text-white flex-1"
                        />
                        {family.children.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeArrayItem(family.children, (items) => setFamily({...family, children: items}), index)}
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem(family.children, (items) => setFamily({...family, children: items}))}
                      className="mt-2 text-blue-400 border-blue-400 hover:bg-blue-400/10"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add another child
                    </Button>
                  </div>

                  <div>
                    <Label className="text-gray-300">Siblings' Names</Label>
                    {family.siblings.map((sibling, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Input
                          value={sibling}
                          onChange={(e) => updateArrayItem(family.siblings, (items) => setFamily({...family, siblings: items}), index, e.target.value)}
                          placeholder="Enter sibling's name"
                          className="bg-gray-900/50 border-gray-600 text-white flex-1"
                        />
                        {family.siblings.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeArrayItem(family.siblings, (items) => setFamily({...family, siblings: items}), index)}
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem(family.siblings, (items) => setFamily({...family, siblings: items}))}
                      className="mt-2 text-blue-400 border-blue-400 hover:bg-blue-400/10"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add another sibling
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Hometowns */}
            {currentStep === 5 && (
              <div className="border rounded-lg p-4 bg-gray-900/30">
                <h3 className="text-lg font-medium text-white mb-4">Hometowns (Optional)</h3>
                <div className="space-y-4">
                  {hometowns.map((hometown, index) => (
                    <div key={index} className="border rounded p-3 bg-gray-800/30">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-gray-300">City</Label>
                          <Input
                            value={hometown.city}
                            onChange={(e) => updateHometown(index, 'city', e.target.value)}
                            placeholder="Enter city"
                            className="bg-gray-900/50 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">State/Province</Label>
                          <Input
                            value={hometown.state}
                            onChange={(e) => updateHometown(index, 'state', e.target.value)}
                            placeholder="Enter state"
                            className="bg-gray-900/50 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Country</Label>
                          <Input
                            value={hometown.country}
                            onChange={(e) => updateHometown(index, 'country', e.target.value)}
                            placeholder="Enter country"
                            className="bg-gray-900/50 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                      {hometowns.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeHometown(index)}
                          className="mt-2 text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHometown}
                    className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add another hometown
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Saving...' : 'Finish Onboarding'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}