import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LowSampleWarningProps {
  count: number;
  threshold?: number;
  lang: 'tr' | 'en';
}

export const LowSampleWarning: React.FC<LowSampleWarningProps> = ({ count, threshold = 30, lang }) => {
  if (count >= threshold) return null;

  const text = lang === 'tr'
    ? `Düşük Örneklem Uyarısı: Bu oyun için toplanan bağımsız geri bildirim sayısı (${count}), minimum güvenilirlik eşiği olan ${threshold}'un altındadır. Görüntülenen yüzdeler tüm oyuncu kitlesine genellenmemeli, niteliksel geri bildirim olarak değerlendirilmelidir.`
    : `Low Sample Warning: The number of independent player comments collected for this game (${count}) is below the confidence threshold (${threshold}). Percentages should not be generalized to the entire player base.`;

  return (
    <div className="warning-box">
      <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
};
