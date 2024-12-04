import json
import pandas as pd

# data fetching algorithms
def load_dataset(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def extract_genres(song):
    return song.get('genres', "").split(", ") if 'genres' in song else [""]

# two sorting algorithms
def merge_sort(data, key):
    # base case
    if len(data) <= 1:
        return data

    # else, split the list into two
    mid = len(data) // 2
    left = merge_sort(data[:mid], key)
    right = merge_sort(data[mid:], key)

    # merge the sorted halves
    return merge(left, right, key)

def merge(left, right, key):
    sorted_list = []
    while left and right:
        if key(left[0]) < key(right[0]):
            sorted_list.append(left.pop(0))
        else:
            sorted_list.append(right.pop(0))
    sorted_list.extend(left or right)
    return sorted_list

def quick_sort(data, key):
    # base case
    if len(data) <= 1:
        return data

    # choose the pivot
    pivot = data[0]
    less = [item for item in data[1:] if key(item) <= key(pivot)]
    greater = [item for item in data[1:] if key(item) > key(pivot)]

    # recursively sort and combine
    return quick_sort(less, key) + [pivot] + quick_sort(greater, key)

# save sorted data to a JSON file
def save_to_json(data, file_name):
    with open(file_name, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

# main
if __name__ == "__main__":
    # load the dataset
    dataset_path = 'FILE_2351.json'
    dataset = load_dataset(dataset_path)

    # merge sort
    merge_sorted = merge_sort(dataset, extract_genres)

    # quick sort
    quick_sorted = quick_sort(dataset, extract_genres)

    # save results to JSON files
    save_to_json(merge_sorted, "merge_sorted.json")
    save_to_json(quick_sorted, "quick_sorted.json")

    # display
    print("First 5 entries in merge sort:")
    for entry in merge_sorted[:5]:
        print(entry)

    print("\nFirst 5 entries in quick sort:")
    for entry in quick_sorted[:5]:
        print(entry)

    print("Sorted datasets are saved.")
