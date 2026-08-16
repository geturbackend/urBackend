import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LiquidBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const size = new THREE.Vector2();
    renderer.getSize(size);
    const pixelRatio = renderer.getPixelRatio();
    const renderWidth = size.x * pixelRatio;
    const renderHeight = size.y * pixelRatio;

    // Liquid Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(renderWidth, renderHeight) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform vec2 uResolution;
        varying vec2 vUv;
        
        void main() {
          vec2 st = gl_FragCoord.xy / uResolution.xy;
          
          // Refraction waves
          float dist = distance(st, uMouse);
          float wave = sin(dist * 20.0 - uTime * 2.0) * 0.05;
          
          // Color based on teal/cyan aesthetic
          vec3 color = vec3(0.0, 0.96, 0.83) * (0.1 + wave * (1.0 - dist));
          
          gl_FragColor = vec4(color, 0.15 - dist * 0.1);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const geometry = new THREE.PlaneGeometry(20, 20, 32, 32);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = -5;
    scene.add(plane);

    camera.position.z = 1;

    let mouseX = 0.5;
    let mouseY = 0.5;

    const handleMouseMove = (event) => {
      mouseX = event.clientX / window.innerWidth;
      mouseY = 1.0 - (event.clientY / window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      material.uniforms.uTime.value = clock.getElapsedTime();
      
      // Smoothly interpolate mouse position
      material.uniforms.uMouse.value.x += (mouseX - material.uniforms.uMouse.value.x) * 0.05;
      material.uniforms.uMouse.value.y += (mouseY - material.uniforms.uMouse.value.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      const newSize = new THREE.Vector2();
      renderer.getSize(newSize);
      const pr = renderer.getPixelRatio();
      material.uniforms.uResolution.value.set(newSize.x * pr, newSize.y * pr);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }} 
    />
  );
}
