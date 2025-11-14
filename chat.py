from local_rag import generate_answer
from youtube_search import get_youtube_links

def main():
    print("\n🎓 AI Study Assistant — Multi-Subject Mode")
    print("Type 'exit' to quit.\n")

    while True:
        subject = input("📘 Enter subject (e.g., ML, DBMS): ").strip()
        if subject.lower() == "exit":
            break

        while True:
            query = input(f"\nYou ({subject}): ").strip()
            if query.lower() == "exit":
                break

            answer, sources = generate_answer(query, subject)
            print(f"\nTutor: {answer}\n")
            print(f"📚 Sources: {sources}")

            print("\n🎥 Recommended YouTube Videos:")
            videos = get_youtube_links(query)
            for v in videos:
                print(f"- {v['title']}: {v['link']}")
            print("-" * 70)

if __name__ == "__main__":
    main()
