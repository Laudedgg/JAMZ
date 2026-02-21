import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { navigateToSection, handleInitialNavigation } from './lib/navigation';
import { HeroSection } from './components/HeroSection';
import { Features } from './components/Features';
import { TrendingShowcase } from './components/TrendingShowcase';
import { MusicEconomySection } from './components/MusicEconomySection';
import { MusicDiscoveryPage } from './pages/MusicDiscoveryPage';
import { ArtistSignupSection } from './components/ArtistSignupSection';
import { DiscoveryFeatureSection } from './components/DiscoveryFeatureSection';
import { KickstarterSection } from './components/KickstarterSection';
import { ContactMarketing } from './components/ContactMarketing';
import { FAQ } from './components/FAQ';
import { TrackDetails } from './components/TrackDetails';
import { MusicPlayer } from './components/MusicPlayer';
import { SplineScene } from './components/SplineScene';
import { StaticGridBackground } from './components/StaticGridBackground';
import { Logo } from './components/Logo';
import { Footer } from './components/Footer';
// Username prompt removed
import { AdminDashboard } from './pages/AdminDashboard';
import { ArtistsManagement } from './pages/ArtistsManagement';
import { TracksManagement } from './pages/TracksManagement';
import { UsersManagement } from './pages/UsersManagement';
import { MusicSenseGamesAdmin } from './pages/MusicSenseGamesAdmin';
import { AdminLogin } from './pages/AdminLogin';
import { AdminSettings } from './pages/AdminSettings';
import { AdminWithdrawals } from './pages/AdminWithdrawals';
import { WalletPage } from './pages/WalletPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ArtistLogin } from './pages/ArtistLogin';
import { ArtistRegister } from './pages/ArtistRegister';
import { ArtistDashboard } from './pages/ArtistDashboard';
import { ArtistCampaignDetail } from './pages/ArtistCampaignDetail';
import { ArtistCampaignManagement } from './pages/ArtistCampaignManagement';
import { AAAWaitlistAdmin } from './pages/AAAWaitlistAdmin';
import { ContactSubmissionsAdmin } from './pages/ContactSubmissionsAdmin';
import { ShowcaseManagerPage } from './pages/ShowcaseManagerPage';
import { MusicSenseLanding } from './pages/MusicSenseLanding';
import { MusicSenseGamePage } from './pages/MusicSenseGame';
import JoinMusicSenseGamePage from './pages/JoinMusicSenseGame';
import MusicSenseSubmissionPage from './pages/MusicSenseSubmission';
import { CountdownPage } from './pages/CountdownPage';
import { OpenVersePage } from './pages/OpenVersePage';
import { OpenVerseCampaignPage } from './pages/OpenVerseCampaignPage';
import { OpenVerseAdmin } from './pages/OpenVerseAdmin';
import { OpenVerseCampaignDetail } from './pages/OpenVerseCampaignDetail';
import { KeyboardTestPage } from './pages/KeyboardTestPage';
import UnifiedCampaignPage from './pages/UnifiedCampaignPage';
import { KickstarterDashboard } from './pages/KickstarterDashboard';
import { KickstarterCampaignDetail } from './pages/KickstarterCampaignDetail';
import { UsernameSetupModal } from './components/UsernameSetupModal';
import { DiscoverySurveyModal } from './components/DiscoverySurveyModal';
import PaymentTest from './pages/PaymentTest';
import { SpotifyCallback } from './pages/SpotifyCallback';
import { SpotifyTestPage } from './pages/SpotifyTestPage';

import { useAuthStore } from './lib/auth';
import { Shield, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { AppKitProvider } from './lib/appkit';
import { CustomLoginButton } from './components/CustomLoginButton';
import { ModalProvider, useModal } from './lib/modalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { Sidebar } from './components/Sidebar';
import { BottomNavigation } from './components/BottomNavigation';
import { isPWA } from './lib/pwaUtils';

// Mobile-optimized collapsible header
function WebsiteNav() {
  const { isAuthenticated, isAdmin, user, walletAddress } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(true);
  const location = useLocation();

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 [WebsiteNav] Auth state:', { isAuthenticated, isAdmin, hasUser: !!user, walletAddress });
  }, [isAuthenticated, isAdmin, user, walletAddress]);

  // Check if we're on Open Verse pages
  const isOpenVersePage = location.pathname.startsWith('/open-verse');

  // Navigation links array for reuse
  const navLinks = [
    {
      to: "/#features",
      label: "How it works",
      onClick: navigateToSection('features', navigate)
    },
    {
      to: "/open-verse",
      label: "Campaigns",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/open-verse');
      }
    },
    {
      to: "/discover",
      label: "Discover",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/discover');
      }
    },
    // HIDDEN: MusicSense - Uncomment to re-enable
    // {
    //   to: "/musicsense",
    //   label: "MusicSense",
    //   comingSoon: true,
    //   onClick: (e: React.MouseEvent) => {
    //     e.preventDefault();
    //     navigate('/musicsense');
    //   }
    // },
    {
      to: "/#kickstarter",
      label: "Kickstarter",
      comingSoon: true,
      onClick: navigateToSection('kickstarter', navigate)
    },
    {
      to: "/artist/login",
      label: "Artist Login",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/artist/login');
      }
    }
  ];

  // Close mobile menu when location changes
  React.useEffect(() => {
    setIsCollapsed(true);
  }, [location.pathname]);

  return (
    <div className={`fixed w-full z-50 ${isOpenVersePage ? 'px-0 py-0' : 'px-4 py-5'}`}>
      <div className={`nav-container mx-auto ${isOpenVersePage ? 'rounded-none border-b border-[#1E1E1E] bg-black/95 backdrop-blur-xl px-6' : 'rounded-full border border-[#1E1E1E] bg-[#0a0a0a] px-6'} ${!isCollapsed ? 'expanded' : ''}`}>
        {/* Main header row - always visible */}
        <div className="flex justify-between h-[60px] items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-white">
              <Logo className="w-20 h-20 md:w-24 md:h-24" />
            </Link>
          </div>

          {/* Desktop Navigation - hidden on mobile */}
          <div className="hidden md:flex justify-center flex-1 mx-4">
            <div className="flex space-x-8 justify-center">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.to}
                  className="text-white hover:text-white/80 transition-colors text-sm font-medium cursor-pointer relative flex items-center gap-2"
                  onClick={link.onClick}
                >
                  {link.label}
                  {link.comingSoon && (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <Link
                    to="/profile"
                    className="text-white hover:text-white/80 transition-colors text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/wallet"
                    className="text-white hover:text-white/80 transition-colors text-sm font-medium"
                  >
                    Wallet
                  </Link>
                </>
              )}
              {isAuthenticated && isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 text-white hover:text-white/80 transition-colors text-sm font-medium"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right side with connect button and mobile toggle */}
          <div className="flex items-center gap-3">
            <CustomLoginButton />

            {/* Mobile menu toggle button - only visible on mobile */}
            <button
              className="md:hidden flex items-center justify-center focus:outline-none"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Toggle mobile menu"
            >
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5 text-white" />
              ) : (
                <ChevronUp className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible mobile navigation - only visible on mobile */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] py-4 border-t border-white/10 mt-2 opacity-100'}`}
        >
          <div className="flex flex-col space-y-4">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className="text-white hover:text-white/80 transition-colors text-sm font-medium py-2 relative flex items-center"
                onClick={(e) => {
                  link.onClick(e);
                  setIsCollapsed(true);
                }}
              >
                {link.label}
                {link.comingSoon && (
                  <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link
                  to="/profile"
                  className="text-white hover:text-white/80 transition-colors text-sm font-medium py-2"
                  onClick={() => setIsCollapsed(true)}
                >
                  Profile
                </Link>
                <Link
                  to="/wallet"
                  className="text-white hover:text-white/80 transition-colors text-sm font-medium py-2"
                  onClick={() => setIsCollapsed(true)}
                >
                  Wallet
                </Link>
              </>
            )}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 text-white hover:text-white/80 transition-colors text-sm font-medium py-2"
                onClick={() => setIsCollapsed(true)}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  return <>{children}</>;
}

function AdminNav() {
  const { signOut } = useAuthStore();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-white/60 hover:text-white transition-colors">
            Back to Website
          </Link>
          <button
            onClick={() => signOut()}
            className="text-white/60 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { checkAuth, isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isArtistRoute = location.pathname.startsWith('/artist');
  const { isModalOpen } = useModal();
  const [showUsernameModal, setShowUsernameModal] = React.useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuth();

    // Handle navigation if there's a hash in the URL
    if (location.pathname === '/' && location.hash) {
      handleInitialNavigation();
    }
  }, [checkAuth, location.pathname, location.hash]);

  // Show username modal if user needs to set username
  useEffect(() => {
    if (isAuthenticated && user?.needsUsername && !isAdminRoute && !isArtistRoute) {
      setShowUsernameModal(true);
      setShowDiscoveryModal(false);
    } else {
      setShowUsernameModal(false);
    }
  }, [isAuthenticated, user?.needsUsername, isAdminRoute, isArtistRoute]);

  // Show discovery survey modal after username setup (or if username is already set but onboarding not completed)
  useEffect(() => {
    const shouldShowDiscovery = isAuthenticated &&
                                !user?.needsUsername &&
                                !user?.onboardingCompleted &&
                                !isAdminRoute &&
                                !isArtistRoute &&
                                !showUsernameModal;

    // Debug logging
    console.log('🔍 Discovery Modal Check:', {
      isAuthenticated,
      needsUsername: user?.needsUsername,
      onboardingCompleted: user?.onboardingCompleted,
      isAdminRoute,
      isArtistRoute,
      showUsernameModal,
      shouldShowDiscovery,
      user: user ? { id: user.id, email: user.email } : null
    });

    if (shouldShowDiscovery) {
      console.log('✅ Showing Discovery Modal');
      setShowDiscoveryModal(true);
    } else if (!showUsernameModal) {
      // Only hide discovery modal if username modal is also not showing
      // This prevents hiding it when username modal closes
      console.log('❌ Hiding Discovery Modal (conditions not met)');
      setShowDiscoveryModal(false);
    }
  }, [isAuthenticated, user?.needsUsername, user?.onboardingCompleted, isAdminRoute, isArtistRoute, showUsernameModal, user]);

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  return (
    <div className="min-h-screen bg-black">
      {!isAdminRoute && !isArtistRoute && (
        <style>{`@media (min-width: 768px) { .sidebar-offset { margin-left: ${sidebarWidth}px !important; } }`}</style>
      )}
      {isAdminRoute ? <AdminNav /> :
       isArtistRoute ? null : (
        <>
          {/* Background - offset on desktop to not show under sidebar */}
          <div className="fixed inset-0 z-0 hidden md:block transition-all duration-300" style={{ left: sidebarCollapsed ? 72 : 240 }}>
            <div className="absolute inset-0 opacity-70">
              <SplineScene />
            </div>
            {/* Static grid for performance - AnimatedBackground only in HeroSection */}
            <StaticGridBackground />
          </div>
          {/* Desktop Sidebar - hidden on mobile */}
          <div className="hidden md:block">
            <Sidebar onCollapse={setSidebarCollapsed} />
          </div>
          {/* Mobile Top Nav - hidden on desktop */}
          <div className="md:hidden">
            <WebsiteNav />
          </div>
        </>
      )}

      <div className="relative flex flex-col min-h-screen">
        <main
          className={`relative z-10 flex-grow transition-all duration-300 ${
          isAdminRoute ? 'bg-black pt-16' :
          isArtistRoute ? 'bg-black' : 'sidebar-offset'
        } ${
          isAdminRoute ? '' :
          isArtistRoute ? '' :
          location.pathname.startsWith('/open-verse') ? 'pt-[80px] md:pt-0 pb-4 md:pb-0' :
          location.pathname === '/discover' ? 'pt-[100px] md:pt-0 pb-4' :
          location.pathname === '/' ? 'pt-0 md:pt-0 pb-4 md:pb-0' :
          'pt-[100px] md:pt-0 pb-4 md:pb-0'
        }`}
        >
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection />
                <MusicEconomySection />
                <Features />
                <TrendingShowcase />
                <ArtistSignupSection />
                <DiscoveryFeatureSection />
                <KickstarterSection />
                <ContactMarketing />
                <FAQ />
              </>
            } />
            <Route path="/track/:id" element={<TrackDetails />} />
            <Route path="/discover" element={<MusicDiscoveryPage />} />
            <Route path="/spotify-callback" element={<SpotifyCallback />} />
            <Route path="/spotify-test" element={<SpotifyTestPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/payment-test" element={<PaymentTest />} />

            <Route path="/open-verse" element={<OpenVersePage />} />
            <Route path="/open-verse/:id" element={<OpenVerseCampaignPage />} />

            {/* Kickstarter Routes */}
            <Route path="/kickstarter" element={<KickstarterDashboard />} />
            <Route path="/kickstarter/campaign/:id" element={<KickstarterCampaignDetail />} />

            {/* HIDDEN: MusicSense Routes - Uncomment to re-enable */}
            {/* <Route path="/musicsense" element={<CountdownPage />} /> */}
            {/* <Route path="/countdown" element={<CountdownPage />} /> */}
            {/* <Route path="/musicsense-admin" element={<MusicSenseLanding />} /> */}
            {/* <Route path="/musicsense/join/:gameId" element={<JoinMusicSenseGamePage />} /> */}
            {/* <Route path="/musicsense/submit/:gameId" element={<MusicSenseSubmissionPage />} /> */}
            {/* <Route path="/musicsense/game/:gameId" element={<MusicSenseGamePage />} /> */}

            <Route path="/keyboard-test" element={<KeyboardTestPage />} />


            {/* Artist Routes */}
            <Route path="/artist/login" element={<ArtistLogin />} />
            <Route path="/artist/register" element={<ArtistRegister />} />
            <Route path="/artist/dashboard" element={<ArtistDashboard />} />
            <Route path="/artist/campaigns/:id" element={<ArtistCampaignDetail />} />
            <Route path="/artist/campaign-management/:id" element={<ArtistCampaignManagement />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Navigate to="/admin/open-verse" replace />
              </ProtectedRoute>
            } />
            <Route path="/admin/artists" element={
              <ProtectedRoute>
                <ArtistsManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/tracks" element={
              <ProtectedRoute>
                <TracksManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <UsersManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/musicsense-games" element={
              <ProtectedRoute>
                <MusicSenseGamesAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/aaa-waitlist" element={
              <ProtectedRoute>
                <AAAWaitlistAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/contact-submissions" element={
              <ProtectedRoute>
                <ContactSubmissionsAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/open-verse" element={
              <ProtectedRoute>
                <OpenVerseAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/open-verse/:id" element={
              <ProtectedRoute>
                <OpenVerseCampaignDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/showcase-manager" element={
              <ProtectedRoute>
                <ShowcaseManagerPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/withdrawals" element={
              <ProtectedRoute>
                <AdminWithdrawals />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        {!isAdminRoute && !isArtistRoute && !isModalOpen && (
          <>
            {/* Hide Footer on Discover page to prevent overlap with track list */}
            {location.pathname !== '/discover' && <Footer />}
            {/* Show MusicPlayer: Always on /discover, or on all pages when running as PWA */}
            {(location.pathname === '/discover' || isPWA()) && <MusicPlayer />}
            {/* Show BottomNavigation on mobile for non-discover pages (discover page has nav built into MusicPlayer) */}
            {location.pathname !== '/discover' && !isPWA() && <BottomNavigation />}
          </>
        )}

        {!isAdminRoute && !isArtistRoute && isModalOpen && (
          <>
            {/* Show MusicPlayer: Always on /discover, or on all pages when running as PWA */}
            {(location.pathname === '/discover' || isPWA()) && <MusicPlayer />}
            {/* Show BottomNavigation on mobile for non-discover pages when modal is open */}
            {location.pathname !== '/discover' && !isPWA() && <BottomNavigation />}
          </>
        )}

        {/* Username Setup Modal */}
        <UsernameSetupModal
          isOpen={showUsernameModal}
          onClose={() => {
            setShowUsernameModal(false);
            // Show discovery survey after username setup (whether set or skipped)
            setShowDiscoveryModal(true);
          }}
          onSuccess={() => {
            setShowUsernameModal(false);
            checkAuth(); // Refresh auth state
            // Show discovery survey after username setup
            setShowDiscoveryModal(true);
          }}
        />

        {/* Discovery Survey Modal */}
        <DiscoverySurveyModal
          isOpen={showDiscoveryModal}
          onClose={() => setShowDiscoveryModal(false)}
          onSuccess={() => {
            setShowDiscoveryModal(false);
            checkAuth(); // Refresh auth state
          }}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <AppKitProvider>
      <ModalProvider>
        <NotificationProvider>
          <Router>
            <MusicPlayerProvider>
              <AppContent />
              {/* Username prompt removed */}
            </MusicPlayerProvider>
          </Router>
        </NotificationProvider>
      </ModalProvider>
    </AppKitProvider>
  );
}

export default App;
