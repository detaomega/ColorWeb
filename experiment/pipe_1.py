import numpy as np
import cv2
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
from skimage.filters import sobel, prewitt, roberts, scharr
from sklearn.cluster import KMeans
from collections import Counter
import os

def plot_edge_images_withoutOri(edge_images, output_dir='.', base_filename='', id = 0):
    """
    Plot all edge detection results without the original image
    
    Args:
        edge_images (dict): Dictionary containing edge images from different methods
        output_dir (str): Directory to save output files
        base_filename (str): Base name for the output file
    """
    # Calculate the number of subplots needed
    n_methods = len(edge_images)
    
    # Create a figure with subplots
    fig, axes = plt.subplots(1, n_methods, figsize=(n_methods * 4, 4))
    
    # Plot each edge detection method
    for i, (name, edge_img) in enumerate(edge_images.items()):
        axes[i].imshow(edge_img, cmap='gray')
        axes[i].set_title(f'{name} Edges')
        axes[i].axis('off')
    
    plt.tight_layout()
    
    # Save the figure
    save_path = os.path.join(output_dir, f"{base_filename}_edge{id}.png")
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    print(f"Saved edge detection results to {save_path}")
    
    plt.show()

def load_image(image_path):
    """
    Load an image from the specified path
    
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
    
    # Convert from BGR to RGB (OpenCV loads images in BGR format)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image

def edge_detection(image, mode='normal', blur_level=0, threshold_level=0, sketch_mode=False):
    """
    Apply different edge detection methods to the input image with custom parameters
    
    Args:
        image (numpy.ndarray): Input image
        mode (str): Edge detection mode - 'normal', 'abstract', 'blur', or 'sketch'
        blur_level (int): Level of blur to apply (0-5, where 0 is none and 5 is maximum)
        threshold_level (int): Level of thresholding to apply (0-5, where 0 is none and 5 is maximum)
        sketch_mode (bool): Whether to apply sketch filter effect
        
    Returns:
        dict: Dictionary containing the edge images from different methods
    """
    # Convert to grayscale if it's a color image
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray = image
    
    # Apply initial blur based on blur_level
    if blur_level > 0:
        # Calculate kernel size based on blur level (must be odd)
        kernel_size = 2 * blur_level + 1
        gray = cv2.GaussianBlur(gray, (kernel_size, kernel_size), 0)
    
    # Initialize dictionary for edge images
    edge_images = {}
    
    if mode == 'normal':
        # Standard edge detection methods
        canny_edges = cv2.Canny(gray, 100, 200)
        
        sobel_edges = sobel(gray)
        sobel_edges = (sobel_edges / sobel_edges.max() * 255).astype(np.uint8)
        
        prewitt_edges = prewitt(gray)
        prewitt_edges = (prewitt_edges / prewitt_edges.max() * 255).astype(np.uint8)
        
        laplacian_edges = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian_edges = np.uint8(np.absolute(laplacian_edges))
        
        scharr_edges = scharr(gray)
        scharr_edges = (scharr_edges / scharr_edges.max() * 255).astype(np.uint8)
        
        edge_images = {
            'Canny': canny_edges,
            'Sobel': sobel_edges,
            'Prewitt': prewitt_edges,
            'Laplacian': laplacian_edges,
            'Scharr': scharr_edges
        }
        
    elif mode == 'abstract':
        # More abstract edge detection with high threshold and blur
        # This will create more sparse, abstract edge representations
        
        # Canny with high thresholds for more sparse edges
        canny_high = cv2.Canny(gray, 150, 250)
        
        # Dilated edges for thicker, more abstract lines
        kernel = np.ones((3, 3), np.uint8)
        canny_dilated = cv2.dilate(canny_high, kernel, iterations=2)
        
        # Sobel with higher threshold
        sobel_abstract = sobel(gray)
        # Apply threshold to make it more abstract
        threshold_value = 50 + (20 * threshold_level)
        _, sobel_abstract_thresh = cv2.threshold(
            (sobel_abstract / sobel_abstract.max() * 255).astype(np.uint8), 
            threshold_value, 255, cv2.THRESH_BINARY
        )
        
        # Laplacian with custom post-processing
        laplacian_abstract = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian_abstract = np.uint8(np.absolute(laplacian_abstract))
        # Apply threshold
        _, laplacian_abstract_thresh = cv2.threshold(
            laplacian_abstract, threshold_value, 255, cv2.THRESH_BINARY
        )
        
        # Scharr with custom post-processing
        scharr_abstract = scharr(gray)
        scharr_abstract = (scharr_abstract / scharr_abstract.max() * 255).astype(np.uint8)
        # Apply threshold
        _, scharr_abstract_thresh = cv2.threshold(
            scharr_abstract, threshold_value, 255, cv2.THRESH_BINARY
        )
        
        edge_images = {
            'Abstract_Canny': canny_high,
            'Dilated_Canny': canny_dilated,
            'Abstract_Sobel': sobel_abstract_thresh,
            'Abstract_Laplacian': laplacian_abstract_thresh,
            'Abstract_Scharr': scharr_abstract_thresh
        }
        
    elif mode == 'blur':
        # Create blurred edge representations that are harder to recognize
        
        # Apply additional blur to the edges
        blur_kernel = 2 * (blur_level + 2) + 1
        
        # Canny with blur
        canny_edges = cv2.Canny(gray, 100, 200)
        canny_blur = cv2.GaussianBlur(canny_edges, (blur_kernel, blur_kernel), 0)
        
        # Sobel with blur
        sobel_edges = sobel(gray)
        sobel_edges = (sobel_edges / sobel_edges.max() * 255).astype(np.uint8)
        sobel_blur = cv2.GaussianBlur(sobel_edges, (blur_kernel, blur_kernel), 0)
        
        # Laplacian with blur
        laplacian_edges = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian_edges = np.uint8(np.absolute(laplacian_edges))
        laplacian_blur = cv2.GaussianBlur(laplacian_edges, (blur_kernel, blur_kernel), 0)
        
        # Scharr with blur
        scharr_edges = scharr(gray)
        scharr_edges = (scharr_edges / scharr_edges.max() * 255).astype(np.uint8)
        scharr_blur = cv2.GaussianBlur(scharr_edges, (blur_kernel, blur_kernel), 0)
        
        edge_images = {
            'Blurred_Canny': canny_blur,
            'Blurred_Sobel': sobel_blur,
            'Blurred_Laplacian': laplacian_blur,
            'Blurred_Scharr': scharr_blur
        }
        
    elif mode == 'sketch':
        # Create sketch-like edge representations
        
        # Invert grayscale image
        inverted = cv2.bitwise_not(gray)
        
        # Apply Gaussian blur
        blur_kernel = 2 * (blur_level + 2) + 1
        blurred = cv2.GaussianBlur(inverted, (blur_kernel, blur_kernel), 0)
        
        # Blend inverted and blurred images using color dodge
        sketch = cv2.divide(gray, 255 - blurred, scale=256)
        
        # Canny on sketch
        canny_sketch = cv2.Canny(sketch, 50, 150)
        
        # Standard edges on sketch
        sobel_sketch = sobel(sketch)
        sobel_sketch = (sobel_sketch / sobel_sketch.max() * 255).astype(np.uint8)
        
        # Create pencil sketch effect
        pencil_sketch = cv2.divide(gray, cv2.GaussianBlur(gray, (blur_kernel, blur_kernel), 0) + 1, scale=256)
        
        edge_images = {
            'Pencil_Sketch': pencil_sketch,
            'Sketch_Base': sketch,
            'Sketch_Canny': canny_sketch,
            'Sketch_Sobel': sobel_sketch
        }
    
    # Apply additional post-processing if threshold_level is set
    if threshold_level > 0 and mode != 'abstract':
        # Calculate threshold value based on threshold_level
        threshold_value = 30 * threshold_level
        
        # Apply threshold to all edge images
        thresholded_edges = {}
        for name, edge_img in edge_images.items():
            _, thresh_img = cv2.threshold(edge_img, threshold_value, 255, cv2.THRESH_BINARY)
            thresholded_edges[f'{name}_Thresh'] = thresh_img
        
        # Add thresholded images to the result
        edge_images.update(thresholded_edges)
    
    return edge_images

def plot_edge_images(original_image, edge_images, output_dir='.', base_filename='', id = 0):
    """
    Plot the original image along with all edge detection results
    
    Args:
        original_image (numpy.ndarray): The original input image
        edge_images (dict): Dictionary containing edge images from different methods
        output_dir (str): Directory to save output files
        base_filename (str): Base name for the output file
    """
    # Calculate the number of subplots needed
    n_methods = len(edge_images) + 1  # +1 for the original image
    
    # Create a figure with subplots
    fig, axes = plt.subplots(1, n_methods, figsize=(n_methods * 4, 4))
    
    # Plot the original image
    axes[0].imshow(original_image)
    axes[0].set_title('Original Image')
    axes[0].axis('off')
    
    # Plot each edge detection method
    for i, (name, edge_img) in enumerate(edge_images.items(), start=1):
        axes[i].imshow(edge_img, cmap='gray')
        axes[i].set_title(f'{name} Edges')
        axes[i].axis('off')
    
    plt.tight_layout()
    
    # Save the figure
    save_path = os.path.join(output_dir, f"{base_filename}_compared{id}.png")
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    print(f"Saved comparison to {save_path}")
    
    plt.show()

def question_generator(edge_images, color_counts, output_dir='.', base_filename='', n=5, id = 0):
    """
    Combine edge detection results and top colors visualization into a single figure
    
    Args:
        edge_images (dict): Dictionary containing edge images from different methods
        color_counts (dict): Dictionary mapping colors to pixel counts
        output_dir (str): Directory to save output files
        base_filename (str): Base name for the output file
        n (int): Number of top colors to display
    """
    # Sort colors by count (descending)
    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Get the top N colors and their counts
    top_n_colors = sorted_colors[:n]
    colors = [np.array(color) / 255 for color, _ in top_n_colors]
    counts = [count for _, count in top_n_colors]
    
    # Convert RGB to HEX format
    hex_colors = []
    for rgb_color, _ in top_n_colors:
        r, g, b = rgb_color
        hex_color = f'#{r:02x}{g:02x}{b:02x}'.upper()
        hex_colors.append(hex_color)
        
    labels = [f"{hex_color}: {count}" for hex_color, count in zip(hex_colors, counts)]
    
    # Calculate grid layout
    n_edge_methods = len(edge_images)
    
    # Create figure with two rows
    fig = plt.figure(figsize=(16, 8))
    
    # First row: Edge detection results
    for i, (name, edge_img) in enumerate(edge_images.items()):
        ax = fig.add_subplot(2, max(n_edge_methods, n), i+1)
        ax.imshow(edge_img, cmap='gray')
        ax.set_title(f'{name} Edges')
        ax.axis('off')
    
    # Second row: Top colors
    for i, (color, label) in enumerate(zip(colors, labels)):
        ax = fig.add_subplot(2, max(n_edge_methods, n), n_edge_methods+i+1)
        ax.bar(0, 1, color=color, width=0.8)
        ax.set_title(label)
        ax.set_xticks([])
        ax.set_yticks([])
        ax.axis('off')
    
    plt.tight_layout()
    plt.suptitle("Edge Detection Methods and Top Colors", fontsize=16, y=1.05)
    
    # Save the figure
    save_path = os.path.join(output_dir, f"{base_filename}_question{id}.png")
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    print(f"Saved question visualization to {save_path}")
    
    plt.show()

def color_extract(image, n_colors=10):
    """
    Extract all colors used in the input image (using K-means clustering to reduce colors)
    
    Args:
        image (numpy.ndarray): Input image
        n_colors (int): Number of dominant colors to extract
        
    Returns:
        list: List of RGB colors found in the image
        numpy.ndarray: Image with reduced colors
    """
    # Reshape the image to be a list of pixels
    pixels = image.reshape(-1, 3)
    
    # Apply K-means clustering to find dominant colors
    kmeans = KMeans(n_clusters=n_colors, random_state=42)
    kmeans.fit(pixels)
    
    # Get the colors
    colors = kmeans.cluster_centers_.astype(int)
    
    # Recreate the image with only the n_colors
    labels = kmeans.predict(pixels)
    quantized_image = colors[labels].reshape(image.shape)
    
    return colors, quantized_image

def function_C(image, target_color, tolerance=10):
    """
    Calculate the area (number of pixels) of one color type within the image
    
    Args:
        image (numpy.ndarray): Input image
        target_color (list or tuple): The color to calculate area for [R, G, B]
        tolerance (int): Tolerance for color matching
        
    Returns:
        int: Number of pixels matching the target color
        numpy.ndarray: Binary mask showing the target color
    """
    # Create a mask for pixels matching the target color within tolerance
    target_color = np.array(target_color)
    mask = np.all(np.abs(image - target_color) <= tolerance, axis=2)
    
    # Count the number of pixels that match
    pixel_count = np.sum(mask)
    
    return pixel_count, mask

def get_color_distribution(image, colors):
    """
    Get the distribution of number of pixels of all types of colors
    
    Args:
        image (numpy.ndarray): Input image
        colors (numpy.ndarray): Array of colors to analyze
        
    Returns:
        dict: Dictionary mapping colors (as tuples) to pixel counts
    """
    color_counts = {}
    
    for color in colors:
        pixel_count, _ = function_C(image, color)
        color_tuple = tuple(color)
        color_counts[color_tuple] = pixel_count
    
    return color_counts

def plot_color_distribution(color_counts, output_dir='.', base_filename=''):
    """
    Create a bar chart showing the distribution of each color type and its pixel count
    
    Args:
        color_counts (dict): Dictionary mapping colors to pixel counts
        output_dir (str): Directory to save output files
        base_filename (str): Base name for the output file
    """
    # Sort colors by count for better visualization
    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Prepare data for plotting
    colors_rgb = [np.array(color) / 255 for color, _ in sorted_colors]
    counts = [count for _, count in sorted_colors]
    
    # Convert RGB to HEX for x-axis labels
    hex_colors = []
    for rgb_color, _ in sorted_colors:
        r, g, b = rgb_color
        hex_color = f'#{r:02x}{g:02x}{b:02x}'.upper()
        hex_colors.append(hex_color)
    
    # Create the bar chart
    plt.figure(figsize=(14, 8))
    bars = plt.bar(range(len(counts)), counts, color=colors_rgb)
    
    # Add labels and styling
    plt.title('Distribution of Color Types by Pixel Count')
    plt.xlabel('Color (HEX)')
    plt.ylabel('Number of Pixels')
    plt.grid(True, alpha=0.3, axis='y')
    
    # Set x-axis ticks and labels
    if len(hex_colors) > 20:
        # If too many colors, show only a selection to avoid cluttering
        step = len(hex_colors) // 10
        plt.xticks(
            range(0, len(hex_colors), step),
            [hex_colors[i] for i in range(0, len(hex_colors), step)],
            rotation=45, ha='right'
        )
    else:
        plt.xticks(range(len(hex_colors)), hex_colors, rotation=45, ha='right')
    
    plt.tight_layout()
    
    # Save the figure
    save_path = os.path.join(output_dir, f"{base_filename}_color_distribution.png")
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    print(f"Saved color distribution to {save_path}")
    
    plt.show()

def plot_top_colors(color_counts, output_dir='.', base_filename='', n=5):
    """
    Plot the top N colors as a color bar with hex color codes
    
    Args:
        color_counts (dict): Dictionary mapping colors to pixel counts
        output_dir (str): Directory to save output files
        base_filename (str): Base name for the output file
        n (int): Number of top colors to display
    """
    # Sort colors by count (descending)
    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Get the top N colors and their counts
    top_n_colors = sorted_colors[:n]
    colors = [np.array(color) / 255 for color, _ in top_n_colors]
    counts = [count for _, count in top_n_colors]
    
    # Convert RGB to HEX format
    hex_colors = []
    for rgb_color, _ in top_n_colors:
        r, g, b = rgb_color
        hex_color = f'#{r:02x}{g:02x}{b:02x}'.upper()
        hex_colors.append(hex_color)
        
    labels = [f"{hex_color}: {count}" for hex_color, count in zip(hex_colors, counts)]
    
    # Create a color bar plot with improved labels
    plt.figure(figsize=(14, 3))
    for i, (color, count) in enumerate(zip(colors, counts)):
        plt.bar(i, 1, color=color)
    
    plt.xticks(range(n), labels, rotation=0)
    plt.title('Top 5 Colors by Pixel Count')
    plt.tight_layout()
    
    # Save the figure
    save_path = os.path.join(output_dir, f"{base_filename}_top5_color.png")
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    print(f"Saved top colors to {save_path}")
    
    plt.show()

def plot_reduced_image(original_image, quantized_image, output_dir='.', base_filename=''):
    """
    Plot the original image alongside the quantized (reduced color) image
    
    Args:
        original_image (numpy.ndarray): The original input image
        quantized_image (numpy.ndarray): The image with reduced colors
        output_dir (str): Directory to save output files
        base_filename (str): Base name for the output file
    """
    plt.figure(figsize=(10, 6))
    plt.subplot(1, 2, 1)
    plt.imshow(original_image)
    plt.title('Original Image')
    plt.axis('off')
    
    plt.subplot(1, 2, 2)
    plt.imshow(quantized_image.astype(np.uint8))
    plt.title('Quantized Image (Reduced Colors)')
    plt.axis('off')
    plt.tight_layout()
    
    # Save the figure
    save_path = os.path.join(output_dir, f"{base_filename}_reduced_result.png")
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    print(f"Saved reduced color result to {save_path}")
    
    plt.show()

def main(image_path, output_dir='.'):
    """
    Main function to process the image and display results
    
    Args:
        image_path (str): Path to the input image
        output_dir (str): Directory to save output files
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Get the base filename without extension for saving output files
        base_filename = os.path.splitext(os.path.basename(image_path))[0]
        
        # 1. Load the input image
        print(f"Loading image from {image_path}...")
        original_image = load_image(image_path)
        
        # 2. Apply edge detection methods
        print("Applying edge detection methods...")
        modes = ['normal', 'abstract', 'blur', 'sketch']
        edge_images = []
        for mode in modes:
            edge_image = edge_detection( original_image, mode = mode)
            edge_images.append(edge_image)

        
        # 3. Plot the original image and edge detection results
        print("Plotting edge detection results with original image...")
        id = 0
        for edge_image in edge_images:
            id+=1
            plot_edge_images(original_image, edge_image, output_dir, base_filename, id = id)
        
        # 4. Plot edge detection results without original image
        print("Plotting edge detection results without original image...")
        
        id = 0
        for edge_image in edge_images:
            id+=1
            plot_edge_images_withoutOri(edge_image, output_dir, base_filename, id = id)
        
        # 5. Extract dominant colors
        print("Extracting dominant colors...")
        colors, quantized_image = color_extract(original_image)
        
        # 6. Get color distribution
        print("Calculating color distribution...")
        color_counts = get_color_distribution(original_image, colors)
        
        # 7. Plot the quantized image (with reduced colors)
        print("Plotting reduced color result...")
        plot_reduced_image(original_image, quantized_image, output_dir, base_filename)
        
        # 8. Plot histogram of color distribution
        print("Plotting histogram of color distribution...")
        plot_color_distribution(color_counts, output_dir, base_filename)
        
        # 9. Plot top 5 colors with hex codes
        print("Plotting top 5 colors...")
        plot_top_colors(color_counts, output_dir, base_filename)
        
        # 10. Generate question visualization
        print("Generating combined visualization...")
        id = 0
        for edge_image in edge_images:
            id+=1
            question_generator(edge_image, color_counts, output_dir, base_filename, id = id)
        
        # 11. Print color information with hex codes
        print("\nDominant Colors in the Image:")
        for i, (color, count) in enumerate(sorted(color_counts.items(), key=lambda x: x[1], reverse=True)):
            r, g, b = color
            hex_color = f'#{r:02x}{g:02x}{b:02x}'.upper()
            print(f"Color {i+1}: RGB{color} (HEX: {hex_color}) - {count} pixels")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    image_path = "alan.jpg"
    
    output_dir = "pipe_1"
    
    main(image_path, output_dir)