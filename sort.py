# Load the JSON file containing the dataset
import json

# Load the dataset
file_path = 'FILE_2351.json'
with open(file_path, 'r') as file:
    dataset = json.load(file)

# Extract the genre information for sorting purposes
def extract_genres(song):
    # Return a sortable representation of the genres (if available)
    return song['genres'].split(", ") if song['genres'] else [""]

# Merge Sort Implementation
def merge_sort(data, key_func):
    if len(data) <= 1:
        return data

    mid = len(data) // 2
    left = merge_sort(data[:mid], key_func)
    right = merge_sort(data[mid:], key_func)

    return merge(left, right, key_func)

def merge(left, right, key_func):
    sorted_list = []
    while left and right:
        if key_func(left[0]) < key_func(right[0]):
            sorted_list.append(left.pop(0))
        else:
            sorted_list.append(right.pop(0))
    sorted_list.extend(left or right)
    return sorted_list

# Quick Sort Implementation
def quick_sort(data, key_func):
    if len(data) <= 1:
        return data

    pivot = data[0]
    less = [item for item in data[1:] if key_func(item) <= key_func(pivot)]
    greater = [item for item in data[1:] if key_func(item) > key_func(pivot)]

    return quick_sort(less, key_func) + [pivot] + quick_sort(greater, key_func)

# Sort the dataset using Merge Sort by genres
sorted_by_merge = merge_sort(dataset, extract_genres)

# Sort the dataset using Quick Sort by genres
sorted_by_quick = quick_sort(dataset, extract_genres)

# Prepare sorted results for display
import pandas as pd

merge_sorted_df = pd.DataFrame(sorted_by_merge)
quick_sorted_df = pd.DataFrame(sorted_by_quick)

# Display the first 10 rows of each sorted result
import ace_tools as tools; tools.display_dataframe_to_user(name="Merge Sorted Dataset by Genres", dataframe=pd.DataFrame(sorted_by_merge))
tools.display_dataframe_to_user(name="Quick Sorted Dataset by Genres", dataframe=pd.DataFrame(sorted_by_quick))
