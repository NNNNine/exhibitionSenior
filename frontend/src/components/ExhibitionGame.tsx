'use client'

import { Unity, useUnityContext } from "react-unity-webgl";

export default function ExhibitionGame() {
  const { unityProvider, isLoaded, loadingProgression } = useUnityContext({
    loaderUrl: "/unity/Build/ExhibitionClient.loader.js",
    dataUrl: "/unity/Build/ExhibitionClient.data",
    frameworkUrl: "/unity/Build/ExhibitionClient.framework.js",
    codeUrl: "/unity/Build/ExhibitionClient.wasm",
  });

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      {!isLoaded && (
        <p className="text-white text-xl flex items-center justify-center">{Math.round(loadingProgression * 100)}%</p>
      )}
      <Unity
        unityProvider={unityProvider}
        style={{ width: "100%", height: "100%", visibility: isLoaded ? "visible" : "hidden" }}
      />
    </div>
  );
}
