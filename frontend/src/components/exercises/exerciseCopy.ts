type ExerciseLike = {
  type?: string;
  prompt?: string;
  options?: any;
};

const LANGUAGE_LABELS: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  ja: 'Japanese',
};

const SPEECH_LANGS: Record<string, string> = {
  Spanish: 'es-ES',
  French: 'fr-FR',
  Japanese: 'ja-JP',
};

export function getCourseLanguageLabel(languageCode?: string | null) {
  if (!languageCode) return 'the course language';
  return LANGUAGE_LABELS[languageCode] ?? 'the course language';
}

export function getSpeechLanguage(languageLabel?: string | null) {
  if (!languageLabel) return 'en-US';
  return SPEECH_LANGS[languageLabel] ?? 'en-US';
}


export function getExerciseInstruction(
  exercise: ExerciseLike,
  courseLanguageLabel = 'the course language',
  courseLanguageCode?: string | null,
) {
  const isJapanese = courseLanguageCode === 'ja' || courseLanguageLabel === 'Japanese';
  const translationScriptHint = isJapanese ? 'in romaji (English letters)' : `in ${courseLanguageLabel}`;

  switch (exercise.type) {
    case 'multiple_choice':
      return 'Choose the English meaning of the word or phrase.';
    case 'match_pairs':
      return `Match the English words with the ${courseLanguageLabel} words.`;
    case 'fill_blank':
      return `Tap the words to complete the sentence in ${courseLanguageLabel}.`;
    case 'translate':
      return `Translate the English sentence into ${courseLanguageLabel} and type your answer ${translationScriptHint}.`;
    case 'type_answer':
      return `Type your answer ${translationScriptHint} exactly as requested.`;
    default:
      return 'Answer the question below.';
  }
}
