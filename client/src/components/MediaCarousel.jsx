import React from 'react';

// Using the newly generated gorgeous images and Government Scheme YouTube videos
export const MEDIA_ARRAY = [
  { type: 'image', url: '/indian_vaccination_1.png' }, 
  { type: 'image', url: 'https://images.unsplash.com/photo-1584483766114-2cea6fbe8cbc?w=1080&q=80' }, 
  { type: 'image', url: '/indian_vaccination_2.png' }, 
  { type: 'image', url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1080&q=80' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1080&q=80' },
];

const MediaCarousel = ({ currentSlideIndex }) => {
  return (
    <>
      {MEDIA_ARRAY.map((media, i) => {
        const isActive = i === currentSlideIndex;
        const baseStyle = {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 1.1s ease',
          zIndex: 0,
          pointerEvents: 'none', // Critical for iframes so they don't block carousel clicks
          border: 'none',
          objectFit: 'cover'
        };

        if (media.type === 'youtube') {
          return (
            <div key={i} style={{...baseStyle, overflow: 'hidden'}}>
              <iframe
                src={`https://www.youtube.com/embed/${media.url}?autoplay=${isActive ? 1 : 0}&mute=1&loop=1&playlist=${media.url}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                style={{ width: '100vw', height: '100vh', objectFit: 'cover', transform: 'scale(1.3)', border: 'none', pointerEvents: 'none' }}
                allow="autoplay; encrypted-media"
                title={`Gov Scheme Video ${i}`}
              />
            </div>
          );
        }

        if (media.type === 'video') {
          return (
            <video
              key={i}
              src={media.url}
              style={{ ...baseStyle, objectFit: 'cover' }}
              autoPlay
              loop
              muted
              playsInline
            />
          );
        }

        return (
          <div
            key={i}
            style={{
              ...baseStyle,
              backgroundImage: `url(${media.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        );
      })}
    </>
  );
};

export default MediaCarousel;
