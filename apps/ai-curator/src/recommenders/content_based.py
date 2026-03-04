
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Optional
import os

class ContentRecommender:
    def __init__(self):
        self.movies_df = pd.DataFrame()
        self.similarity_matrix = None
        self.movie_id_map = {}  # Map movie_id to index
        self.tfidf = TfidfVectorizer(stop_words='english')

    def fit(self, movies_data: List[Dict]):
        """
        Train the content-based model.
        movies_data: List of dicts with 'id', 'title', 'description', 'genres'
        """
        print("Training ContentRecommender...")
        if not movies_data:
            print("No movies data provided for training.")
            return

        # Create DataFrame
        self.movies_df = pd.DataFrame(movies_data)
        
        # Fill missing values
        self.movies_df['description'] = self.movies_df['description'].fillna('')
        
        # Combine features for TF-IDF (Description + Genres + Title)
        # Assuming genres is a string or list of strings
        def process_genres(x):
            if isinstance(x, list):
                return ' '.join(x)
            return str(x)
            
        self.movies_df['genres_str'] = self.movies_df['genres'].apply(process_genres)
        self.movies_df['combined_features'] = (
            self.movies_df['title'] + " " + 
            self.movies_df['description'] + " " + 
            self.movies_df['genres_str']
        )

        # Compute TF-IDF matrix
        tfidf_matrix = self.tfidf.fit_transform(self.movies_df['combined_features'])

        # Compute Cosine Similarity matrix
        self.similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

        # Create mapping from Movie ID to DataFrame Index
        self.movie_id_map = pd.Series(
            self.movies_df.index, index=self.movies_df['id']
        ).to_dict()
        
        print(f"ContentRecommender trained on {len(self.movies_df)} movies.")

    def get_similar_movies(self, movie_id: str, limit: int = 5) -> List[Dict]:
        """
        Get similar movies based on content similarity.
        """
        if self.similarity_matrix is None:
            return []

        if movie_id not in self.movie_id_map:
            return []

        # Get index of the movie
        idx = self.movie_id_map[movie_id]

        # Get pairwise similarity scores
        sim_scores = list(enumerate(self.similarity_matrix[idx]))

        # Sort movies based on the similarity scores
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        # Get the scores of the similar movies (skip the movie itself at index 0)
        sim_scores = sim_scores[1 : limit + 1]

        # Get movie indices
        movie_indices = [i[0] for i in sim_scores]

        # Return similar movies metadata
        recommendations = []
        for i, score in zip(movie_indices, sim_scores):
            movie = self.movies_df.iloc[i]
            recommendations.append({
                "movie_id": movie['id'],
                "title": movie['title'],
                "posterUrl": movie.get('posterUrl'),
                "score": float(score[1]),
                "reason": "Similar content"
            })

        return recommendations
