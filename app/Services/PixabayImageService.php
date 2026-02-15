<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PixabayImageService
{
    /**
     * Find a relevant image from Pixabay based on the article title.
     *
     * @param  string  $title     Article title to derive search keywords from
     * @param  string  $language  Language code for search (en, ro, de, fr, etc.)
     * @return array{url: string, alt: string, photographer: string}|null
     */
    public function findImage(string $title, string $language = 'en'): ?array
    {
        $apiKey = config('services.pixabay.key');

        if (! $apiKey) {
            Log::warning('PixabayImageService: no PIXABAY_API_KEY configured');

            return null;
        }

        // Extract meaningful keywords from title (remove stop words)
        $keywords = $this->extractKeywords($title, $language);

        if (empty($keywords)) {
            return null;
        }

        // Pixabay supports these language codes
        $supportedLangs = ['cs', 'da', 'de', 'en', 'es', 'fr', 'id', 'it', 'hu', 'nl', 'no', 'pl', 'pt', 'ro', 'sk', 'fi', 'sv', 'tr', 'vi', 'th', 'bg', 'ru', 'el', 'ja', 'ko', 'zh'];
        $lang = in_array($language, $supportedLangs) ? $language : 'en';

        try {
            $response = Http::timeout(15)
                ->get('https://pixabay.com/api/', [
                    'key' => $apiKey,
                    'q' => $keywords,
                    'lang' => $lang,
                    'image_type' => 'photo',
                    'orientation' => 'horizontal',
                    'min_width' => 800,
                    'min_height' => 400,
                    'safesearch' => 'true',
                    'order' => 'popular',
                    'per_page' => 5,
                ]);

            if (! $response->successful()) {
                Log::warning('PixabayImageService: API error', [
                    'status' => $response->status(),
                ]);

                return null;
            }

            $hits = $response->json('hits', []);

            if (empty($hits)) {
                // Retry with fewer keywords
                $fewerKeywords = $this->extractKeywords($title, $language, 2);
                if ($fewerKeywords && $fewerKeywords !== $keywords) {
                    return $this->searchPixabay($apiKey, $fewerKeywords, $lang);
                }

                return null;
            }

            // Pick a random image from top results for variety
            $image = $hits[array_rand($hits)];

            return [
                'url' => $image['largeImageURL'] ?? $image['webformatURL'],
                'alt' => Str::limit($title, 125),
                'photographer' => $image['user'] ?? 'Pixabay',
            ];
        } catch (\Throwable $e) {
            Log::error('PixabayImageService: exception', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Search Pixabay with given keywords.
     */
    private function searchPixabay(string $apiKey, string $keywords, string $lang): ?array
    {
        try {
            $response = Http::timeout(15)
                ->get('https://pixabay.com/api/', [
                    'key' => $apiKey,
                    'q' => $keywords,
                    'lang' => $lang,
                    'image_type' => 'photo',
                    'orientation' => 'horizontal',
                    'min_width' => 800,
                    'safesearch' => 'true',
                    'order' => 'popular',
                    'per_page' => 5,
                ]);

            $hits = $response->json('hits', []);

            if (empty($hits)) {
                return null;
            }

            $image = $hits[array_rand($hits)];

            return [
                'url' => $image['largeImageURL'] ?? $image['webformatURL'],
                'alt' => $keywords,
                'photographer' => $image['user'] ?? 'Pixabay',
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Extract search keywords from a title.
     * Removes common stop words and returns the most significant terms.
     */
    private function extractKeywords(string $title, string $language = 'en', int $maxWords = 4): string
    {
        // Common stop words for multiple languages
        $stopWords = [
            // English
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
            'these', 'those', 'it', 'its', 'not', 'no', 'how', 'what', 'when',
            'where', 'who', 'which', 'why', 'as', 'if', 'than', 'so', 'just',
            'about', 'up', 'out', 'new', 'also', 'one', 'all', 'after', 'over',
            // Romanian
            'si', 'de', 'la', 'in', 'pe', 'cu', 'din', 'un', 'o', 'a', 'al',
            'ale', 'lui', 'ei', 'lor', 'sau', 'dar', 'ca', 'mai', 'este', 'sunt',
            'fost', 'fie', 'va', 'vor', 'ar', 'nu', 'ce', 'care', 'cum', 'cand',
            'unde', 'acest', 'aceasta', 'aceste', 'pentru', 'prin', 'doar',
            'foarte', 'intr', 'cele', 'dupa', 'despre', 'acum', 'dintre',
        ];

        // Clean the title
        $clean = mb_strtolower($title);
        $clean = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $clean);
        $words = preg_split('/\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY);

        // Filter out stop words and short words
        $keywords = array_filter($words, function ($word) use ($stopWords) {
            return mb_strlen($word) > 2 && ! in_array($word, $stopWords);
        });

        // Take the first N meaningful words
        $keywords = array_slice(array_values($keywords), 0, $maxWords);

        return implode(' ', $keywords);
    }
}
