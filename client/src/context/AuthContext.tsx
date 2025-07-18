import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Create a mock user that will always be logged in
  const mockUser = {
    uid: 'enterprise-123456',
    email: 'alex.johnson@acmecorp.com',
    displayName: 'Alex Johnson',
    emailVerified: true,
    // Add other required User properties
    isAnonymous: false,
    photoURL: null,
    providerData: [{
      uid: 'enterprise-123456',
      displayName: 'Alex Johnson',
      email: 'alex.johnson@acmecorp.com',
      photoURL: null,
      providerId: 'password',
      phoneNumber: null
    }],
    metadata: {
      creationTime: '2023-10-15T10:30:00Z',
      lastSignInTime: Date.now().toString()
    },
    phoneNumber: '+15551234567',
    refreshToken: 'mock-refresh-token',
    tenantId: 'enterprise',
    delete: async () => {},
    getIdToken: async () => 'mock-id-token',
    getIdTokenResult: async () => ({ token: 'mock-token', claims: { role: 'admin', company: 'Acme Corporation' }, issuedAtTime: '', expirationTime: '', authTime: '', signInProvider: 'password', signInSecondFactor: null }),
    reload: async () => {},
    toJSON: () => ({})
  } as unknown as User;

  const [currentUser, setCurrentUser] = useState<User | null>(mockUser); // Start with mock user
  const [loading, setLoading] = useState(false); // No loading state needed

  useEffect(() => {
    // Simply set the mock user without waiting for Firebase
    setCurrentUser(mockUser);
    setLoading(false);
    
    // Return empty cleanup function
    return () => {};
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}