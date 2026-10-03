export interface FeatureItem {
  value: number;
  unit: string;
  display_name: string;
  short_name: string;
}

export interface RoundData {
  id: string;
  display_name: string;
  is_candidate: boolean;
  features: Record<string, FeatureItem>;
}

export interface ShapContribution {
  feature: string;
  display_name: string;
  short_name: string;
  value: number;
  unit: string;
  direction: 'planet' | 'impostor';
  shap_value: number;
  magnitude: number;
  fragment: string;
}

export interface GuessResult {
  id: string;
  display_name: string;
  user_guess: 'CONFIRMED' | 'FALSE POSITIVE';
  is_candidate: boolean;
  true_label: 'CONFIRMED' | 'FALSE POSITIVE' | null;
  model_prediction: 'CONFIRMED' | 'FALSE POSITIVE';
  model_probability: {
    CONFIRMED: number;
    'FALSE POSITIVE': number;
  };
  user_correct: boolean | null;
  model_correct: boolean | null;
  top_shap_contributions: ShapContribution[];
  explanation: string;
}

export interface FeatureDictItem {
  name: string;
  short_name: string;
  unit: string;
  plain_description: string;
  detection_significance: string;
  typical_range: string;
  planet_tendency: string;
}

export interface ModelStats {
  model_type: string;
  random_seed: number;
  train_samples: number;
  val_samples: number;
  test_samples: number;
  metrics: {
    accuracy: number;
    roc_auc: number;
    f1_score: number;
    planet: {
      precision: number;
      recall: number;
      f1: number;
    };
    impostor: {
      precision: number;
      recall: number;
    };
  };
  confusion_matrix: {
    true_negatives_impostor: number;
    false_positives_planet_leak: number;
    false_negatives_missed_planet: number;
    true_positives_planet: number;
    matrix: number[][];
  };
  feature_importances: Record<string, number>;
}

export interface GameScore {
  streak: number;
  bestStreak: number;
  roundsPlayed: number;
  userCorrectCount: number;
  modelCorrectCount: number;
}
