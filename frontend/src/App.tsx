import React, { useState, useEffect } from 'react';
import { PatientProfile, SystemStatus } from './types';
import { api } from './api';
import {
  CustomThemeSettings,
  loadSavedThemeSettings,
  applyTheme
} from './theme/themeEngine';

import { Header } from './components/Header';
import { Sidebar, SectionId } from './components/Sidebar';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { CommandPalette } from './components/CommandPalette';
import { EmergencyCard } from './components/EmergencyCard';
import { FloatingCopilot } from './components/FloatingCopilot';

import { DashboardView } from './views/DashboardView';
import { CopilotView } from './views/CopilotView';
import { RecordsView } from './views/RecordsView';
import { ReviewCenterView } from './views/ReviewCenterView';
import { TimelineView } from './views/TimelineView';
import { MedicationsView } from './views/MedicationsView';
import { ReportsView } from './views/ReportsView';
import { FamilyView } from './views/FamilyView';
import { AppointmentsView } from './views/AppointmentsView';
import { AppearanceView } from './views/AppearanceView';
import { PrivacyView } from './views/PrivacyView';
import { AiQualityView } from './views/AiQualityView';
import { DemoView } from './views/DemoView';
import { HelpView } from './views/HelpView';

export function App() {
  const [themeSettings, setThemeSettings] = useState<CustomThemeSettings>(loadSavedThemeSettings());
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [currentSection, setCurrentSection] = useState<SectionId>('dashboard');

  // Modals
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);

  // Copilot pre-filled prompt
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState<string | undefined>(undefined);
  // Review selected doc
  const [reviewDocId, setReviewDocId] = useState<string | null>(null);

  // Initialize theme
  useEffect(() => {
    applyTheme(themeSettings);
  }, []);

  // Fetch initial demo user & patients
  const refreshAllData = () => {
    api.demoLogin()
      .then((loginRes) => {
        return api.getPatients().then((pts) => {
          setPatients(pts || []);
          const active = pts.find((p) => p.is_active === 1) || pts[0] || null;
          setActivePatient(active);
        });
      })
      .catch((err) => console.error('Initial login error', err));

    api.getSystemStatus()
      .then((status) => setSystemStatus(status))
      .catch((err) => console.error('Status check error', err));
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectPatient = async (patientId: string) => {
    try {
      await api.activatePatient(patientId);
      const updatedPts = await api.getPatients();
      setPatients(updatedPts);
      const active = updatedPts.find((p) => p.id === patientId) || null;
      setActivePatient(active);
    } catch (err: any) {
      console.error('Failed to activate patient', err);
    }
  };

  const handleAskCopilot = (prompt: string) => {
    setCopilotInitialPrompt(prompt);
    setCurrentSection('copilot');
  };

  const handleOpenDocument = (docId: string) => {
    setReviewDocId(docId);
    setCurrentSection('review');
  };

  return (
    <div className={`min-h-screen bg-bg text-text transition-colors duration-150 flex flex-col`}>
      {/* Top Header */}
      <Header
        patients={patients}
        activePatient={activePatient}
        onSelectPatient={handleSelectPatient}
        systemStatus={systemStatus}
        onOpenAccessibility={() => setShowAccessibility(true)}
        onOpenThemeStudio={() => setCurrentSection('appearance')}
        onToggleEmergencyCard={() => setShowEmergencyCard(!showEmergencyCard)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
          elderlyMode={themeSettings.elderlyMode}
        />

        {/* Dynamic View Area */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {/* Always Visible Emergency Card if Elderly Mode Active or Triggered */}
          {(showEmergencyCard || themeSettings.elderlyMode) && (
            <div className="mb-6">
              <EmergencyCard
                patient={activePatient}
                onClose={themeSettings.elderlyMode ? undefined : () => setShowEmergencyCard(false)}
              />
            </div>
          )}

          {currentSection === 'dashboard' && (
            <DashboardView
              activePatient={activePatient}
              onNavigate={(sec) => setCurrentSection(sec)}
              onAskCopilot={handleAskCopilot}
              elderlyMode={themeSettings.elderlyMode}
            />
          )}

          {currentSection === 'copilot' && (
            <CopilotView
              activePatient={activePatient}
              onOpenDocument={handleOpenDocument}
              initialPrompt={copilotInitialPrompt}
              elderlyMode={themeSettings.elderlyMode}
            />
          )}

          {currentSection === 'records' && (
            <RecordsView
              activePatient={activePatient}
              onNavigate={(sec) => setCurrentSection(sec)}
              onSelectDocumentForReview={handleOpenDocument}
            />
          )}

          {currentSection === 'review' && (
            <ReviewCenterView
              activePatient={activePatient}
              selectedDocId={reviewDocId}
            />
          )}

          {currentSection === 'timeline' && (
            <TimelineView
              activePatient={activePatient}
              onOpenDocument={handleOpenDocument}
            />
          )}

          {currentSection === 'medications' && (
            <MedicationsView
              activePatient={activePatient}
              elderlyMode={themeSettings.elderlyMode}
            />
          )}

          {currentSection === 'reports' && (
            <ReportsView activePatient={activePatient} />
          )}

          {currentSection === 'family' && (
            <FamilyView
              patients={patients}
              activePatient={activePatient}
              onSelectPatient={handleSelectPatient}
              onRefreshPatients={refreshAllData}
            />
          )}

          {currentSection === 'appointments' && (
            <AppointmentsView activePatient={activePatient} />
          )}

          {currentSection === 'appearance' && (
            <AppearanceView
              settings={themeSettings}
              onUpdateSettings={(s) => setThemeSettings(s)}
            />
          )}

          {currentSection === 'privacy' && (
            <PrivacyView activePatient={activePatient} />
          )}

          {currentSection === 'ai-quality' && (
            <AiQualityView
              systemStatus={systemStatus}
              onRefreshStatus={refreshAllData}
            />
          )}

          {currentSection === 'demo' && (
            <DemoView
              patients={patients}
              activePatient={activePatient}
              onSelectPatient={handleSelectPatient}
              onNavigate={(sec) => setCurrentSection(sec)}
              onRefreshData={refreshAllData}
            />
          )}

          {currentSection === 'help' && <HelpView />}
        </main>
      </div>

      {/* Floating Copilot on Every Page */}
      <FloatingCopilot
        activePatient={activePatient}
        onOpenDocument={handleOpenDocument}
        elderlyMode={themeSettings.elderlyMode}
      />

      {/* Accessibility Toolbar Drawer */}
      <AccessibilityToolbar
        isOpen={showAccessibility}
        onClose={() => setShowAccessibility(false)}
        settings={themeSettings}
        onUpdateSettings={(s) => setThemeSettings(s)}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectSection={(sec) => setCurrentSection(sec)}
        patients={patients}
        onSelectPatient={handleSelectPatient}
        onTriggerEmergency={() => setShowEmergencyCard(true)}
      />
    </div>
  );
}

export default App;
