import { v4 as uuidv4 } from 'uuid';

interface UserData {
  sessionId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  canCommit?: string;
  inspiration?: string;
  goals?: string;
  targetIncome?: string;
  startupCapital?: string;
  understanding?: boolean;
  timestamp: string;
  status: 'email_only' | 'partial' | 'complete';
}

class UserDataService {
  private static instance: UserDataService;
  private sessionId: string;
  private data: UserData;
  private lastSubmittedData: string = ''; // Hash of last submitted data
  private autoSubmitTimeout: NodeJS.Timeout | null = null;
  private readonly AUTO_SUBMIT_DELAY = 30 * 60 * 1000; // 30 minutes
  private readonly MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/67dsntvx5ikpa21o25wl05wc8v4tv1vf';

  private constructor() {
    // Get existing session ID from localStorage or create new one
    const existingSessionId = localStorage.getItem('sessionId');
    if (existingSessionId) {
      this.sessionId = existingSessionId;
    } else {
      this.sessionId = uuidv4();
      localStorage.setItem('sessionId', this.sessionId);
    }
    
    // Initialize with data from localStorage if it exists
    const savedData = localStorage.getItem('userData');
    this.data = savedData ? JSON.parse(savedData) : {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      status: 'email_only'
    };

    // Set up beforeunload handler
    window.addEventListener('beforeunload', () => {
      this.handleBeforeUnload();
    });
  }

  public static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService();
    }
    return UserDataService.instance;
  }

  private handleBeforeUnload() {
    // Only submit if we have new data that hasn't been sent
    const currentDataHash = this.hashData(this.data);
    if (currentDataHash !== this.lastSubmittedData) {
      this.sendToMake(this.data, true);
    }
  }

  private hashData(data: UserData): string {
    // Create a simple hash of the data to track changes
    return JSON.stringify(data);
  }

  private determineStatus(data: Partial<UserData>): 'email_only' | 'partial' | 'complete' {
    if (data.understanding && data.firstName && data.lastName && data.phone) {
      return 'complete';
    } else if (Object.keys(data).length > 2) { // More than just email and sessionId
      return 'partial';
    }
    return 'email_only';
  }

  private resetAutoSubmitTimeout() {
    if (this.autoSubmitTimeout) {
      clearTimeout(this.autoSubmitTimeout);
    }

    // Only set timeout if we have incomplete data
    if (this.data.status !== 'complete') {
      this.autoSubmitTimeout = setTimeout(() => {
        const currentDataHash = this.hashData(this.data);
        if (currentDataHash !== this.lastSubmittedData) {
          this.sendToMake(this.data, true);
        }
      }, this.AUTO_SUBMIT_DELAY);
    }
  }

  private async sendToMake(data: Partial<UserData>, isAutoSubmit: boolean = false) {
    try {
      const currentDataHash = this.hashData(data);
      
      // Don't send if this exact data was already submitted
      if (currentDataHash === this.lastSubmittedData) {
        return;
      }

      const completeData = {
        ...this.data,
        ...data,
        timestamp: new Date().toISOString(),
        isAutoSubmit,
        status: this.determineStatus(data)
      };

      const response = await fetch(this.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeData),
      });

      if (!response.ok) {
        throw new Error('Failed to send data to Make webhook');
      }

      // Update last submitted data hash
      this.lastSubmittedData = this.hashData(completeData);
      
      // Save to localStorage
      localStorage.setItem('userData', JSON.stringify(completeData));
      
      // Clear timeout after successful complete submission
      if (completeData.status === 'complete' && this.autoSubmitTimeout) {
        clearTimeout(this.autoSubmitTimeout);
        this.autoSubmitTimeout = null;
      }
    } catch (error) {
      console.error('Error sending data to Make webhook:', error);
    }
  }

  public async updateEmail(email: string) {
    const newData = {
      ...this.data,
      email,
      status: 'email_only' as const
    };

    // Only update if email changed
    if (email !== this.data.email) {
      this.data = newData;
      await this.sendToMake({ email });
      this.resetAutoSubmitTimeout();
    }
  }

  public async updateQuestionnaireData(formData: Partial<UserData>) {
    const newData = {
      ...this.data,
      ...formData,
      status: this.determineStatus(formData)
    };

    // Only update if data actually changed
    if (this.hashData(newData) !== this.hashData(this.data)) {
      this.data = newData;
      await this.sendToMake(formData);
      
      // Clear auto-submit timeout if we have complete data
      if (newData.status === 'complete' && this.autoSubmitTimeout) {
        clearTimeout(this.autoSubmitTimeout);
        this.autoSubmitTimeout = null;
      }
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getCurrentData(): UserData {
    return this.data;
  }
}

export const userDataService = UserDataService.getInstance();