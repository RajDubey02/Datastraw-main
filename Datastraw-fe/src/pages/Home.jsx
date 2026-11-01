import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CustomerView from '../components/CustomerView';
import AgentView from '../components/AgentView';
import LoginModal from '../components/LoginModal';

export default function Home() {
  const [activeView, setActiveView] = useState('customer');
  const [isAgentLoggedIn, setIsAgentLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const savedAgent = localStorage.getItem('verdant_agent_auth');
    if (savedAgent) {
      setIsAgentLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (agent) => {
    localStorage.setItem('verdant_agent_auth', JSON.stringify(agent));
    setIsAgentLoggedIn(true);
  };

  const handleAgentLogout = () => {
    localStorage.removeItem('verdant_agent_auth');
    setIsAgentLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-gray-800">
      <Navbar
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          if (view === 'agent' && !isAgentLoggedIn) {
            setShowLoginModal(true);
          }
        }}
        isAgentLoggedIn={isAgentLoggedIn}
        onAgentLogout={handleAgentLogout}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <main className="flex-1 py-6">
        {activeView === 'customer' ? (
          <CustomerView />
        ) : (
          <AgentView
            isAgentLoggedIn={isAgentLoggedIn}
            onOpenLogin={() => setShowLoginModal(true)}
          />
        )}
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
