export type OpenCVStatus = 'loading' | 'loaded' | 'failed';

class OpenCVService {
  private status: OpenCVStatus = 'loading';
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.loadingPromise = new Promise<void>((resolve, reject) => {
      if (window.cv) {
        this.status = 'loaded';
        resolve();
        return;
      }
      document.addEventListener('opencv-ready', () => {
        if (window.cv) {
          this.status = 'loaded';
          resolve();
        } else {
          this.status = 'failed';
          reject(new Error('OpenCV loaded event fired but cv is not available'));
        }
      });

      setTimeout(() => {
        if (this.status !== 'loaded') {
          this.status = 'failed';
          reject(new Error('OpenCV loading timed out'));
        }
      }, 30000);
    });
  }

  public async waitForOpenCV(): Promise<void> {
    return this.loadingPromise as Promise<void>;
  }

  public getStatus(): OpenCVStatus {
    return this.status;
  }
}

const opencvService = new OpenCVService();
export default opencvService;
declare global {
  interface Window {
    cv: any;
  }
}