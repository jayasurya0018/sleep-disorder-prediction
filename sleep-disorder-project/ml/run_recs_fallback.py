from recommender_fallback import save_recs_for_user

if __name__ == '__main__':
    out = save_recs_for_user(user_idx=0, top_k=3)
    print('Wrote fallback recommendations to', out)
