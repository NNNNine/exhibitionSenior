'use client';

import { useEffect, useState } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { Card, Spin, Alert, Progress } from 'antd';
import { motion } from 'framer-motion';
import unityBridge from '@/lib/unityBridge';

interface UnityViewerProps {
  exhibitionId: string;
  onArtworkSelect?: (artworkId: string) => void;
}

const UnityViewer: React.FC<UnityViewerProps> = ({ exhibitionId, onArtworkSelect }) => {
  const [error, setError] = useState<string | null>(null);
  const [unityReady, setUnityReady] = useState<boolean>(false);
  const [exhibitionLoaded, setExhibitionLoaded] = useState<boolean>(false);

  // Set up Unity context
  const {
    unityProvider,
    isLoaded,
    loadingProgression,
    addEventListener,
    removeEventListener,
    UNSAFE__unityInstance
  } = useUnityContext({
    loaderUrl: '/unity/exhibition.loader.js',
    dataUrl: '/unity/exhibition.data',
    frameworkUrl: '/unity/exhibition.framework.js',
    codeUrl: '/unity/exhibition.wasm',
  });

  // When Unity is loaded, set the instance in the bridge
  useEffect(() => {
    if (isLoaded && UNSAFE__unityInstance) {
      unityBridge.setUnityInstance(UNSAFE__unityInstance);
      
      // Register event listeners for Unity messages
      unityBridge.on('UnityReady', () => {
        console.log('Unity is ready to load exhibitions');
        setUnityReady(true);
      });
      
      unityBridge.on('ExhibitionLoaded', (loadedExhibitionId) => {
        console.log(`Exhibition loaded: ${loadedExhibitionId}`);
        setExhibitionLoaded(true);
      });
      
      unityBridge.on('ArtworkSelected', (artworkId) => {
        console.log(`Artwork selected: ${artworkId}`);
        if (onArtworkSelect) {
          onArtworkSelect(artworkId);
        }
      });
    }
    
    return () => {
      // Cleanup event listeners when component unmounts
      if (unityBridge) {
        unityBridge.off('UnityReady');
        unityBridge.off('ExhibitionLoaded');
        unityBridge.off('ArtworkSelected');
      }
    };
  }, [isLoaded, UNSAFE__unityInstance, onArtworkSelect]);
  
  // Load exhibition when ID changes and Unity is ready
  useEffect(() => {
    if (unityReady && exhibitionId) {
      console.log(`Loading exhibition: ${exhibitionId}`);
      setExhibitionLoaded(false);
      unityBridge.loadExhibition(exhibitionId);
    }
  }, [exhibitionId, unityReady]);
  
  // Handle Unity WebGL errors
  useEffect(() => {
    const handleError = (errorEvent: ErrorEvent) => {
      console.error('Unity WebGL Error:', errorEvent);
      setError('Failed to load 3D exhibition. Please check your browser compatibility.');
    };
    
    addEventListener('error', handleError);
    
    return () => {
      removeEventListener('error', handleError);
    };
  }, [addEventListener, removeEventListener]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-[80vh] relative rounded-lg overflow-hidden shadow-xl"
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="absolute inset-0 z-20 flex items-center justify-center"
        />
      )}
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-8">
          <Spin size="large" />
          <div className="mt-6 text-white text-lg font-medium">
            Loading 3D Exhibition Environment
          </div>
          <div className="w-full max-w-md mt-4">
            <Progress 
              percent={Math.round(loadingProgression * 100)} 
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
          <div className="mt-2 text-gray-400 text-sm">
            {Math.round(loadingProgression * 100)}% complete
          </div>
        </div>
      )}
      
      {isLoaded && !exhibitionLoaded && !error && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <Card className="bg-white p-4 rounded-lg shadow-lg">
            <Spin tip="Loading exhibition..."></Spin>
          </Card>
        </div>
      )}
      
      <Unity 
        unityProvider={unityProvider} 
        style={{ width: '100%', height: '100%' }}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
      />
    </motion.div>
  );
};

export default UnityViewer;