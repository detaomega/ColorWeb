import numpy as np
import cv2
import os
import base64
from datetime import datetime

def load_image(image_path):
    """
    Load image
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        image (numpy.ndarray): The loaded image
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image: {image_path}")
    
    return image

def apply_slic(img, region_size, ruler=20.0, iterations=20):
    """
    Apply SLIC with specific parameters
    
    Args:
        img: Input image
        region_size: Average superpixel size
        ruler: Smoothness factor (fixed at 20.0)
        iterations: Number of iterations (fixed at 20)
    
    Returns:
        tuple: (result image, number of superpixels)
    """
    try:
        slic = cv2.ximgproc.createSuperpixelSLIC(img, 
                                                algorithm=cv2.ximgproc.SLICO, 
                                                region_size=region_size, 
                                                ruler=ruler)
        slic.iterate(iterations)
        
        labels = slic.getLabels()
        n_segments = slic.getNumberOfSuperpixels()
        
        # mask_slic = slic.getLabelContourMask()
        
        superpixel_result = img.copy()
        for i in range(n_segments):
            mask = labels == i
            superpixel_result[mask] = np.mean(img[mask], axis=0)
        
        # superpixel_result[mask_slic == 255] = [0, 255, 0]
        
        return superpixel_result, n_segments
        
    except AttributeError:
        print("SLIC not available in your OpenCV installation")
        return None, 0


def run_focused_experiment(image_path, output_dir):
    """
    Run focused SLIC experiment with region size variations only
    
    Args:
        image_path: Path to input image
        output_dir: Directory to save results
    """
    base_filename = os.path.splitext(os.path.basename(image_path))[0]
    experiment_dir = os.path.join(output_dir, f"{base_filename}")
    os.makedirs(experiment_dir, exist_ok=True)
    
    # Load image
    print(f"Loading image from {image_path}...")
    img = load_image(image_path)

    #get image dimensions
    height, width, channels = img.shape

    # Save original image
    cv2.imwrite(os.path.join(experiment_dir, "original.jpg"), img)
    
    # Fixed parameters
    iterations = 15 if height < 750 and width < 750 else 20 if height > 2000 or width > 2000 else 17
    ruler = 25 if height < 750 and width < 750 else 35 if height > 2000 or width > 2000 else 30
    size = "small" if height < 750 and width < 750 else "large" if height > 2000 or width > 2000 else "medium"
    algorithm = "SLICO"
    
    # Region sizes to test
    region_sizes = {}
    region_sizes["small"] = [10,13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58, 61, 64]
    region_sizes["medium"] = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110]
    region_sizes["large"] = [20, 30, 40, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125]
    region_sizes["normal"] = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]
    results = []
    
    print(f"Running SLIC experiments with fixed parameters:")
    print(f"Algorithm: {algorithm}, Ruler: {ruler}, Iterations: {iterations}")
    print(f"Testing region sizes: {region_sizes}")

    for region_size in region_sizes["normal"]:
        print(f"Testing region size: {region_size}")
        
        # Apply SLIC
        result, n_segments = apply_slic(img, region_size, ruler, iterations)
        
        if result is not None:
           
            
            filename = f"{region_size}_segments{n_segments}.jpg"
            cv2.imwrite(os.path.join(experiment_dir, filename), result)
            
            results.append({
                'image': result,
                'region_size': region_size,
                'segments': n_segments
            })
    
    # comparison grid
    create_comparison_grid(results, experiment_dir)
    
    print(f"\nExperiment complete! Results saved to: {experiment_dir}")
    
    pass

def create_comparison_grid(results, output_dir):
    """
    Create a single comparison grid for region sizes
    
    Args:
        results: List of experiment results
        output_dir: Directory to save grid
    """
    if not results:
        return
    
    n_images = len(results)
    img_height, img_width = results[0]['image'].shape[:2]
    
    grid_width = img_width * n_images
    grid_height = img_height + 80  # Extra space for title
    grid = np.zeros((grid_height, grid_width, 3), dtype=np.uint8)
    
    font = cv2.FONT_HERSHEY_SIMPLEX
    title = "SLIC Region Size Comparison (SLICO, Ruler=20, Iterations=20)"
    cv2.putText(grid, title, (20, 40), font, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
    
    subtitle = f"Region Sizes: {[r['region_size'] for r in results]}"
    cv2.putText(grid, subtitle, (20, 70), font, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
    
    for idx, result in enumerate(results):
        x_start = idx * img_width
        x_end = x_start + img_width
        y_start = 80
        y_end = y_start + img_height
        
        grid[y_start:y_end, x_start:x_end] = result['image']
    
    filename = "region_size_comparison.jpg"
    cv2.imwrite(os.path.join(output_dir, filename), grid)
    pass



def main():
    """
    Main function
    """
    # Replace with your image path

    image_path = "D:\\113 - 2\\web\\anime image\\Inazuma Eleven_3.jpg"
    # Replace with your output path
    output_dir = 'slic_result'
    run_focused_experiment(image_path, output_dir)
    

if __name__ == "__main__":
    main()