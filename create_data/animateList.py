import os

dir = "dataset"
folder_name = []
for name in os.listdir(dir):
    folder_name.append(name)
print(folder_name)