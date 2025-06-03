import cv2
import numpy as np
import os
from typing import Tuple

def resize_with_pad(image: np.array, 
                    new_shape: Tuple[int, int], 
                    padding_color: Tuple[int] = (255, 255, 255)) -> np.array:
    """Maintains aspect ratio and resizes with padding.
    Params:
        image: Image to be resized.
        new_shape: Expected (width, height) of new image.
        padding_color: Tuple in BGR of padding color
    Returns:
        image: Resized image with padding
    """
    original_shape = (image.shape[1], image.shape[0])
    ratio = float(max(new_shape))/max(original_shape)
    new_size = tuple([int(x*ratio) for x in original_shape])
    image = cv2.resize(image, new_size)
    delta_w = new_shape[0] - new_size[0]
    delta_h = new_shape[1] - new_size[1]
    top, bottom = delta_h//2, delta_h-(delta_h//2)
    left, right = delta_w//2, delta_w-(delta_w//2)
    image = cv2.copyMakeBorder(image, top, bottom, left, right, cv2.BORDER_CONSTANT, value=padding_color)
    return image
  
def main():
    # test
    """
    image = cv2.imread("/path/to/image")
    image = resize_with_pad(image, (256, 256))

    cv2.imshow("Padded image", image)
    cv2.waitKey()
    
    """

    # main pipe
    dataset_dir = 'dataset'
    new_dataset_dir = "dataset_resized"

    # Create the new dataset directory if it doesn't exist
    if not os.path.exists(new_dataset_dir):
        os.makedirs(new_dataset_dir)

    for name in os.listdir(dataset_dir):
        animate_folder_dir = os.path.join(dataset_dir, name)
        
        # Skip if it's not a directory
        if not os.path.isdir(animate_folder_dir):
            continue
            
        # Create corresponding folder in new dataset
        new_animate_folder_dir = os.path.join(new_dataset_dir, name)
        if not os.path.exists(new_animate_folder_dir):
            os.makedirs(new_animate_folder_dir)
        
        for char_folder in os.listdir(animate_folder_dir):
            char_folder_path = os.path.join(animate_folder_dir, char_folder)
            
            # Skip if it's not a directory
            if not os.path.isdir(char_folder_path):
                continue
                
            # Create corresponding character folder in new dataset
            new_char_folder_path = os.path.join(new_animate_folder_dir, char_folder)
            if not os.path.exists(new_char_folder_path):
                os.makedirs(new_char_folder_path)

            for img_file in os.listdir(char_folder_path):
                # Construct full path to the image file
                img_path = os.path.join(char_folder_path, img_file)
                
                # Skip if it's not a file or not an image
                if not os.path.isfile(img_path):
                    continue
                    
                # Check if it's an image file (optional, but recommended)
                if not img_file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif')):
                    continue
                
                print(f"Processing: {img_path}")
                
                try:
                    # Read the image
                    img = cv2.imread(img_path)
                    
                    if img is None:
                        print(f"Warning: Could not read image {img_path}")
                        continue
                    
                    # Resize the image
                    resized_img = resize_with_pad(img, (1024, 1024))
                    
                    # Construct output path with same filename
                    output_path = os.path.join(new_char_folder_path, img_file)
                    
                    # Save the resized image
                    cv2.imwrite(output_path, resized_img)
                    print(f"Saved: {output_path}")
                    
                except Exception as e:
                    print(f"Error processing {img_path}: {str(e)}")

if __name__ == "__main__":
    main()