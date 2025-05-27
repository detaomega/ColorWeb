import numpy as np
import cv2
from sklearn.cluster import KMeans
from collections import Counter
import os

def load_image(image_path):
    """
    Load and convert from BGR to RGB 
    
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
    
    # Keep BGR for cv2.imshow
    return image

def combined_edge_detection(gray, canny_low=30, canny_high=100, 
                          use_canny=True, use_sobel=True, use_laplacian=True):
    """
    Combine multiple edge detection methods for better results
    
    Args:
        gray: Grayscale image
        canny_low, canny_high: Canny edge detection thresholds
        use_canny, use_sobel, use_laplacian: Which methods to use
    
    Returns:
        Combined edge map
    """
    edges_combined = np.zeros_like(gray)
    
    # Apply Gaussian blur first
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Canny edge detection
    if use_canny:
        edges_canny = cv2.Canny(blurred, canny_low, canny_high)
        edges_combined = cv2.bitwise_or(edges_combined, edges_canny)
        cv2.imshow("Canny Edges", edges_canny)
    
    # Sobel edge detection
    if use_sobel:
        sobel_x = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
        sobel_mag = np.sqrt(sobel_x**2 + sobel_y**2)
        sobel_mag = np.uint8(sobel_mag / np.max(sobel_mag) * 255)
        _, edges_sobel = cv2.threshold(sobel_mag, 100, 255, cv2.THRESH_BINARY)
        edges_combined = cv2.bitwise_or(edges_combined, edges_sobel)
        cv2.imshow("Sobel Edges", edges_sobel)
    
    # Laplacian edge detection
    if use_laplacian:
        laplacian = cv2.Laplacian(blurred, cv2.CV_64F)
        laplacian = np.uint8(np.absolute(laplacian))
        _, edges_laplacian = cv2.threshold(laplacian, 30, 255, cv2.THRESH_BINARY)
        edges_combined = cv2.bitwise_or(edges_combined, edges_laplacian)
        cv2.imshow("Laplacian Edges", edges_laplacian)
    
    cv2.imshow("Combined Edges", edges_combined)
    cv2.waitKey(0)
    
    return edges_combined

def improve_edges(edges, morph_close_size=3, morph_close_iterations=2, 
                 morph_dilate_size=3, morph_dilate_iterations=1):
    """
    Improve edge map using morphological operations
    
    Args:
        edges: Binary edge map
        morph_close_size: Kernel size for closing operation
        morph_close_iterations: Number of closing iterations
        morph_dilate_size: Kernel size for dilation
        morph_dilate_iterations: Number of dilation iterations
    
    Returns:
        Improved edge map
    """
    # Close gaps in edges
    kernel_close = np.ones((morph_close_size, morph_close_size), np.uint8)
    closed_edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel_close, 
                                   iterations=morph_close_iterations)
    
    # Dilate to strengthen edges
    kernel_dilate = np.ones((morph_dilate_size, morph_dilate_size), np.uint8)
    dilated_edges = cv2.dilate(closed_edges, kernel_dilate, 
                              iterations=morph_dilate_iterations)
    
    return dilated_edges

def find_dominant_color(region, mask):
    """
    Find the dominant color in a region
    
    Args:
        region (numpy.ndarray): Region image
        mask (numpy.ndarray): Binary mask
        
    Returns:
        tuple: Dominant color (B, G, R)
    """
    # Get pixels within the mask
    pixels = region[mask > 0]
    if len(pixels) == 0:
        return (0, 0, 0)
    
    # Use K-means to find dominant color
    pixels = pixels.reshape(-1, 3)
    kmeans = KMeans(n_clusters=1, n_init=10)
    kmeans.fit(pixels)
    dominant_color = kmeans.cluster_centers_[0].astype(np.uint8)
    # Convert numpy array to tuple of Python integers
    return tuple(int(c) for c in dominant_color)

def main(image_path, output_dir='.', 
         # Contour parameters
         canny_low=30, canny_high=100,
         use_canny=True, use_sobel=True, use_laplacian=True,
         morph_close_size=3, morph_close_iterations=2,
         morph_dilate_size=3, morph_dilate_iterations=1,
         min_contour_area=100,
         # SLIC parameters
         slic_region_size=30, slic_ruler=10.0, slic_iterations=10,
         slic_algorithm=cv2.ximgproc.SLICO):
    """
    Main function with tunable parameters
    
    Args:
        image_path (str): Path to the input image
        output_dir (str): Directory to save output files
        
        Contour parameters:
        canny_low, canny_high: Canny edge detection thresholds
        use_canny, use_sobel, use_laplacian: Which edge detectors to use
        morph_close_size, morph_close_iterations: Morphological closing parameters
        morph_dilate_size, morph_dilate_iterations: Morphological dilation parameters
        min_contour_area: Minimum contour area to keep
        
        SLIC parameters:
        slic_region_size: Average superpixel size (larger = fewer superpixels)
        slic_ruler: Smoothness factor (larger = smoother boundaries)
        slic_iterations: Number of iterations
        slic_algorithm: SLIC variant (SLIC, SLICO, or MSLIC)
    """
    try:
        # Ensure output directory exists
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Get the base filename without extension for saving output files
        base_filename = os.path.splitext(os.path.basename(image_path))[0]
        
        # 1. Load the input image
        print(f"Loading image from {image_path}...")
        img = load_image(image_path)
        cv2.imshow("Original Image", img)
        cv2.waitKey(0)
        
        # Create grayscale version
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 2. Enhanced Contour-Based Segmentation
        print("Applying Enhanced Contour-Based Segmentation...")
        
        # Combined edge detection
        edges = combined_edge_detection(gray, canny_low, canny_high, 
                                      use_canny, use_sobel, use_laplacian)
        
        # Improve edges
        improved_edges = improve_edges(edges, morph_close_size, morph_close_iterations,
                                     morph_dilate_size, morph_dilate_iterations)
        
        cv2.imshow("Improved Edges", improved_edges)
        cv2.waitKey(0)
        
       
        
        # 3. Superpixel Segmentation (SLIC) with tunable parameters
        print("\nApplying Superpixel Segmentation with custom parameters...")
        print(f"SLIC parameters: region_size={slic_region_size}, ruler={slic_ruler}, iterations={slic_iterations}")
        
        try:
            # Create SLIC with custom parameters
            slic = cv2.ximgproc.createSuperpixelSLIC(img, algorithm=slic_algorithm, 
                                                    region_size=slic_region_size, 
                                                    ruler=slic_ruler)
            slic.iterate(slic_iterations)
            
            # Get the labels and number of superpixels
            labels = slic.getLabels()
            n_segments = slic.getNumberOfSuperpixels()
            
            print(f"Number of superpixels: {n_segments}")
            
            # Create mask showing superpixel boundaries
            mask_slic = slic.getLabelContourMask()
            
            # Color the superpixels with their average color
            superpixel_result = img.copy()
            for i in range(n_segments):
                mask = labels == i
                superpixel_result[mask] = np.mean(img[mask], axis=0)
            
            # Add boundaries
            superpixel_result[mask_slic == 255] = [0, 255, 0]
            
            cv2.imshow("SLIC Superpixel Result", superpixel_result)
            cv2.waitKey(0)
            
            # Save SLIC result
            output_path = os.path.join(output_dir, f"{base_filename}_slic.jpg")
            cv2.imwrite(output_path, superpixel_result)
            
        except AttributeError:
            print("SLIC not available in your OpenCV installation")
            print("To use SLIC, install opencv-contrib-python: pip install opencv-contrib-python")
        
        # Close all windows
        cv2.destroyAllWindows()
        
        # Save results
        output_path = os.path.join(output_dir, f"{base_filename}_combined_edges.jpg")
        cv2.imwrite(output_path, edges)
        
        output_path = os.path.join(output_dir, f"{base_filename}_improved_edges.jpg")
        cv2.imwrite(output_path, improved_edges)
        
        print(f"\nResults saved to {output_dir}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Replace with your image path
    image_path = "alan.jpg"
    
    # Specify output directory for saved figures
    output_dir = "pipe_2"
    
    # Call main with custom parameters
    main(image_path, output_dir,
         # Contour parameters - tune these for better results
         canny_low=30,           # Lower value = more edges detected
         canny_high=100,         # Higher value = fewer edges detected  
         use_canny=True,         # Use Canny edge detector
         use_sobel=True,         # Use Sobel edge detector
         use_laplacian=True,     # Use Laplacian edge detector
         morph_close_size=5,     # Kernel size for closing gaps (odd number)
         morph_close_iterations=2, # More iterations = more gap closing
         morph_dilate_size=3,    # Kernel size for edge dilation
         morph_dilate_iterations=1, # More iterations = thicker edges
         min_contour_area=500,   # Minimum area for contours to keep
         
         # SLIC parameters - tune these for fewer, larger superpixels
         slic_region_size=30,    # Larger = fewer superpixels (try 30-100)
         slic_ruler=10.0,        # Higher = smoother boundaries (try 5-20)
         slic_iterations=30,     # More iterations = better convergence
         slic_algorithm=cv2.ximgproc.SLICO  # SLIC variant (SLIC, SLICO, or MSLIC)
    )