import guideImg from '../assets/guide/teacher-guide.png';

export default function GuideMascot({ size = 180, animated = true, className = '' }: { size?: number; animated?: boolean; className?: string }) {
  return (
    <img
      src={guideImg}
      alt="안내 몬스터"
      width={size}
      height={size}
      className={`block mx-auto ${animated ? 'animate-float' : ''} ${className}`}
      style={{ objectFit: 'contain' }}
      draggable={false}
    />
  );
}
