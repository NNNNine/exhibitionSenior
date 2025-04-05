// Define callback function type
type UnityMessageCallback = (data: any) => void;

// Define callback map type
interface CallbackMap {
  [messageType: string]: UnityMessageCallback[];
}

// Define Unity instance interface
interface UnityInstance {
  SendMessage: (gameObject: string, method: string, data: string) => void;
}

class UnityBridge {
  private unityInstance: UnityInstance | null = null;
  private callbacks: CallbackMap = {};
  private isReady: boolean = false;
  
  constructor() {
    // Define method to be called from Unity
    if (typeof window !== 'undefined') {
      (window as any).unityInterface = {
        handleUnityMessage: this.handleUnityMessage.bind(this)
      };
    }
  }
  
  // Initialize Unity instance
  public setUnityInstance(instance: UnityInstance): void {
    this.unityInstance = instance;
    console.log('Unity instance initialized');
  }
  
  // Register callback for specific message type
  public on(messageType: string, callback: UnityMessageCallback): UnityBridge {
    if (!this.callbacks[messageType]) {
      this.callbacks[messageType] = [];
    }
    this.callbacks[messageType].push(callback);
    return this; // For method chaining
  }
  
  // Remove callback
  public off(messageType: string, callback?: UnityMessageCallback): UnityBridge {
    if (this.callbacks[messageType]) {
      if (callback) {
        this.callbacks[messageType] = this.callbacks[messageType]
          .filter(cb => cb !== callback);
      } else {
        delete this.callbacks[messageType];
      }
    }
    return this;
  }
  
  // Handle messages from Unity
  public handleUnityMessage(messageType: string, data: any): void {
    console.log(`Unity message received: ${messageType}`, data);
    
    if (messageType === 'UnityReady') {
      this.isReady = true;
    }
    
    if (this.callbacks[messageType]) {
      this.callbacks[messageType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in Unity callback for ${messageType}:`, error);
        }
      });
    }
  }
  
  // Send message to Unity
  public sendMessage(gameObject: string, method: string, data: string): boolean {
    if (!this.unityInstance) {
      console.warn('Unity instance not initialized yet');
      return false;
    }
    
    try {
      this.unityInstance.SendMessage(gameObject, method, data);
      return true;
    } catch (error) {
      console.error('Error sending message to Unity:', error);
      return false;
    }
  }
  
  // Load exhibition in Unity
  public loadExhibition(exhibitionId: string): boolean {
    return this.sendMessage('GalleryManager', 'LoadExhibition', exhibitionId);
  }
  
  // Select artwork in Unity
  public selectArtwork(artworkId: string): boolean {
    return this.sendMessage('GalleryManager', 'SelectArtwork', artworkId);
  }
  
  // Check if Unity is ready
  public isUnityReady(): boolean {
    return this.isReady;
  }
  
  // Wait for Unity to be ready
  public async waitForUnity(timeout: number = 10000): Promise<boolean> {
    if (this.isReady) return Promise.resolve(true);
    
    return new Promise((resolve, reject) => {
      const readyCallback = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };
      
      const timeoutId = setTimeout(() => {
        this.off('UnityReady', readyCallback);
        reject(new Error('Unity ready timeout'));
      }, timeout);
      
      this.on('UnityReady', readyCallback);
    });
  }
}

// Create singleton instance
const unityBridge = new UnityBridge();
export default unityBridge;