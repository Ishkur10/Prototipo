interface Window {
  electronAPI: {
    processIrisImage: (imagePath: string) => Promise<any>;
  };
  cv: any;
}

interface IrisData {
  pupilCenterX: number;
  pupilCenterY: number;
  pupilRadius: number;
  irisCenterX: number;
  irisCenterY: number;
  irisRadius: number;
}