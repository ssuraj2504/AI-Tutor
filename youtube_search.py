# youtube_search.py
from youtubesearchpython import VideosSearch

def get_youtube_links(topic, limit=3):
    search = VideosSearch(topic, limit=limit)
    results = search.result()['result']
    links = []
    for v in results:
        links.append({
            "title": v['title'],
            "link": v['link']
        })
    return links
