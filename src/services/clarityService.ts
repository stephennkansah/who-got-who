import clarity from '@microsoft/clarity';

export class ClarityService {
  private static isInitialized = false;
  private static projectId = process.env.REACT_APP_CLARITY_PROJECT_ID;

  // Initialize Clarity
  static initialize(): void {
    if (this.isInitialized) return;
    
    if (!this.projectId) {
      console.warn('Clarity Project ID not found. Add REACT_APP_CLARITY_PROJECT_ID to your .env file');
      return;
    }

    try {
      clarity.init(this.projectId);
      this.isInitialized = true;
      console.log('✅ Microsoft Clarity initialized successfully');
      
      // Set basic tags for the game
      this.setTag('app', 'who-got-who');
      this.setTag('version', '1.0.0');
    } catch (error) {
      console.error('Failed to initialize Clarity:', error);
    }
  }

  // Identify users (useful for tracking returning players)
  static identifyUser(userId: string, sessionId?: string, friendlyName?: string): void {
    if (!this.isInitialized) return;
    
    try {
      clarity.identify(userId, sessionId, undefined, friendlyName);
    } catch (error) {
      console.error('Clarity identify error:', error);
    }
  }

  // Set custom tags for filtering sessions
  static setTag(key: string, value: string | string[]): void {
    if (!this.isInitialized) return;
    
    try {
      clarity.setTag(key, value);
    } catch (error) {
      console.error('Clarity setTag error:', error);
    }
  }

  // Track custom events
  static trackEvent(eventName: string): void {
    if (!this.isInitialized) return;
    
    try {
      clarity.event(eventName);
      console.log(`📊 Clarity event tracked: ${eventName}`);
    } catch (error) {
      console.error('Clarity event error:', error);
    }
  }

  // Game-specific event tracking
  static trackGameEvent(event: 'game_created' | 'game_joined' | 'game_started' | 'task_completed' | 'task_failed' | 'game_ended'): void {
    this.trackEvent(event);
  }

  // Track page views with custom page IDs
  static trackPageView(pageName: string): void {
    if (!this.isInitialized) return;
    
    try {
      // Set page-specific tags
      this.setTag('page', pageName);
      this.trackEvent(`page_view_${pageName}`);
    } catch (error) {
      console.error('Clarity page view error:', error);
    }
  }

  // Mark important sessions for priority recording
  static upgradeSession(reason: string): void {
    if (!this.isInitialized) return;
    
    try {
      clarity.upgrade(reason);
      console.log(`🔥 Clarity session upgraded: ${reason}`);
    } catch (error) {
      console.error('Clarity upgrade error:', error);
    }
  }

  // Set cookie consent (if needed for GDPR compliance)
  static setConsent(hasConsent: boolean = true): void {
    if (!this.isInitialized) return;
    
    try {
      clarity.consent(hasConsent);
    } catch (error) {
      console.error('Clarity consent error:', error);
    }
  }
}

export default ClarityService; 