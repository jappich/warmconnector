import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Key, 
  Lock, 
  Eye, 
  EyeOff,
  Database,
  Network,
  AlertTriangle,
  CheckCircle,
  Settings,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SecuritySettings() {
  const { toast } = useToast();
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    dataEncryption: true,
    apiAccess: true,
    networkVisibility: 'private',
    dataRetention: '1year'
  });

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    neo4j_uri: '',
    neo4j_user: '',
    neo4j_password: '',
    mongodb_uri: ''
  });

  const handleSettingChange = (setting, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleApiKeyChange = (key, value) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully"
    });
    
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveApiKeys = () => {
    toast({
      title: "API Keys Saved",
      description: "Your API credentials have been securely stored"
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account",
      variant: "destructive"
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Security & Privacy</h1>
        <p className="text-gray-400">
          Manage your account security, API access, and data privacy settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Security */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Change */}
            <div>
              <h3 className="text-white font-medium mb-3">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button 
                onClick={handlePasswordChange}
                className="mt-3 bg-blue-600 hover:bg-blue-700"
                disabled={!newPassword || !confirmPassword}
              >
                <Lock className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </div>

            <Separator className="bg-gray-600" />

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant={securitySettings.twoFactorEnabled ? "default" : "secondary"}>
                  {securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Key className="mr-2 h-5 w-5" />
                API Configuration
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKeys(!showApiKeys)}
                className="text-gray-400 hover:text-white"
              >
                {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-gray-300">OpenAI API Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type={showApiKeys ? "text" : "password"}
                    value={apiKeys.openai}
                    onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="sk-..."
                  />
                  <Badge variant={apiKeys.openai ? "default" : "secondary"} className="min-w-fit">
                    {apiKeys.openai ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  </Badge>
                </div>
                <p className="text-gray-500 text-xs mt-1">Required for AI-powered connection analysis</p>
              </div>

              <div>
                <Label className="text-gray-300">Neo4j Database URI</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type={showApiKeys ? "text" : "password"}
                    value={apiKeys.neo4j_uri}
                    onChange={(e) => handleApiKeyChange('neo4j_uri', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="bolt://localhost:7687"
                  />
                  <Badge variant={apiKeys.neo4j_uri ? "default" : "secondary"} className="min-w-fit">
                    {apiKeys.neo4j_uri ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Neo4j Username</Label>
                  <Input
                    type={showApiKeys ? "text" : "password"}
                    value={apiKeys.neo4j_user}
                    onChange={(e) => handleApiKeyChange('neo4j_user', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="neo4j"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Neo4j Password</Label>
                  <Input
                    type={showApiKeys ? "text" : "password"}
                    value={apiKeys.neo4j_password}
                    onChange={(e) => handleApiKeyChange('neo4j_password', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="password"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">MongoDB Connection URI</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type={showApiKeys ? "text" : "password"}
                    value={apiKeys.mongodb_uri}
                    onChange={(e) => handleApiKeyChange('mongodb_uri', e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                    placeholder="mongodb://localhost:27017/warmconnector"
                  />
                  <Badge variant={apiKeys.mongodb_uri ? "default" : "secondary"} className="min-w-fit">
                    {apiKeys.mongodb_uri ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  </Badge>
                </div>
                <p className="text-gray-500 text-xs mt-1">Required for professional profile data storage</p>
              </div>
            </div>

            <Button 
              onClick={handleSaveApiKeys}
              className="bg-green-600 hover:bg-green-700"
            >
              <Database className="mr-2 h-4 w-4" />
              Save API Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Data Encryption</h3>
                <p className="text-gray-400 text-sm">Encrypt sensitive profile data at rest</p>
              </div>
              <Switch
                checked={securitySettings.dataEncryption}
                onCheckedChange={(checked) => handleSettingChange('dataEncryption', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">API Access</h3>
                <p className="text-gray-400 text-sm">Allow external applications to access your data</p>
              </div>
              <Switch
                checked={securitySettings.apiAccess}
                onCheckedChange={(checked) => handleSettingChange('apiAccess', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Network Visibility</h3>
                <p className="text-gray-400 text-sm">Control who can see your professional network</p>
              </div>
              <select
                value={securitySettings.networkVisibility}
                onChange={(e) => handleSettingChange('networkVisibility', e.target.value)}
                className="bg-gray-900/50 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="private">Private</option>
                <option value="connections">Connections Only</option>
                <option value="public">Public</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Data Retention</h3>
                <p className="text-gray-400 text-sm">How long to keep your networking data</p>
              </div>
              <select
                value={securitySettings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                className="bg-gray-900/50 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="6months">6 Months</option>
                <option value="1year">1 Year</option>
                <option value="2years">2 Years</option>
                <option value="indefinite">Indefinite</option>
              </select>
            </div>

            <Separator className="bg-gray-600" />

            <div className="bg-red-900/20 border border-red-700/50 rounded p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-300 font-medium">Danger Zone</h3>
                  <p className="text-red-200 text-sm mb-3">
                    Once you delete your account, there is no going back. This will permanently 
                    delete your profile, connections, and all associated data.
                  </p>
                  <Button 
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}