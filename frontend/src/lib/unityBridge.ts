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
  private messageQueue: Array<{gameObject: string, method: string, data: string}> = [];
  
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
    
    // Process any queued messages
    if (this.messageQueue.length > 0) {
      console.log(`Processing ${this.messageQueue.length} queued messages`);
      this.messageQueue.forEach(msg => {
        this.sendMessage(msg.gameObject, msg.method, msg.data);
      });
      this.messageQueue = [];
    }
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
  public handleUnityMessage(messageType: string, dataJson: string): void {
    console.log(`Unity message received: ${messageType}`, dataJson);
    
    let data;
    try {
      data = JSON.parse(dataJson);
    } catch (e) {
      data = dataJson; // If not JSON, use as-is
    }
    
    if (messageType === 'UnityReady') {
      this.isReady = true;
      console.log('Unity is ready for messages');
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
  
  // Send message to Unity with error handling and queuing
  public sendMessage(gameObject: string, method: string, data: any): boolean {
    // Convert data to string if it's not already
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (!this.unityInstance) {
      console.warn('Unity instance not initialized yet, queuing message');
      this.messageQueue.push({gameObject, method, data: dataString});
      return false;
    }
    
    try {
      this.unityInstance.SendMessage(gameObject, method, dataString);
      return true;
    } catch (error) {
      console.error('Error sending message to Unity:', error);
      return false;
    }
  }
  
  // Load exhibition in Unity
  public loadExhibition(exhibitionId: string): boolean {
    console.log(`Requesting Unity to load exhibition: ${exhibitionId}`);
    return this.sendMessage('ExhibitionManager', 'LoadExhibition', exhibitionId);
  }
  
  // Position artwork in Unity
  public positionArtwork(artworkId: string, position: {x: number, y: number, z: number}, rotation: {x: number, y: number, z: number}): boolean {
    const data = {
      artworkId,
      position,
      rotation
    };
    console.log(`Positioning artwork in Unity: ${artworkId}`, data);
    return this.sendMessage('ExhibitionManager', 'PositionArtwork', data);
  }
  
  // Select artwork in Unity
  public selectArtwork(artworkId: string): boolean {
    console.log(`Selecting artwork in Unity: ${artworkId}`);
    return this.sendMessage('ExhibitionManager', 'SelectArtwork', artworkId);
  }
  
  // Check if Unity is ready
  public isUnityReady(): boolean {
    return this.isReady;
  }
  
  // Wait for Unity to be ready with timeout
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