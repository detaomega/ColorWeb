import numpy as np
import cv2
import os
import itertools
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

def apply_slic(img, region_size, ruler, iterations, algorithm):
    """
    Apply SLIC with specific parameters
    
    Args:
        img: Input image
        region_size: Average superpixel size
        ruler: Smoothness factor
        iterations: Number of iterations
        algorithm: SLIC algorithm variant
    
    Returns:
        tuple: (result image, number of superpixels)
    """
    try:
        # Create SLIC with custom parameters
        slic = cv2.ximgproc.createSuperpixelSLIC(img, algorithm=algorithm, 
                                                region_size=region_size, 
                                                ruler=ruler)
        slic.iterate(iterations)
        
        # Get the labels and number of superpixels
        labels = slic.getLabels()
        n_segments = slic.getNumberOfSuperpixels()
        
        # Create mask showing superpixel boundaries
        mask_slic = slic.getLabelContourMask()
        
        # Color the superpixels with their average color
        superpixel_result = img.copy()
        for i in range(n_segments):
            mask = labels == i
            superpixel_result[mask] = np.mean(img[mask], axis=0)
        
        # Add boundaries in green
        superpixel_result[mask_slic == 255] = [0, 255, 0]
        
        return superpixel_result, n_segments
        
    except AttributeError:
        print("SLIC not available in your OpenCV installation")
        return None, 0

def add_text_to_image(img, text_lines, position=(10, 30)):
    """
    Add text to image
    
    Args:
        img: Image to add text to
        text_lines: List of text lines
        position: Starting position for text
    
    Returns:
        Image with text
    """
    result = img.copy()
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6
    font_color = (255, 255, 255)  # White
    thickness = 2
    line_type = cv2.LINE_AA
    
    # Add background rectangle for better text visibility
    padding = 5
    max_width = max([cv2.getTextSize(line, font, font_scale, thickness)[0][0] for line in text_lines])
    total_height = sum([cv2.getTextSize(line, font, font_scale, thickness)[0][1] + 10 for line in text_lines])
    
    cv2.rectangle(result, 
                  (position[0] - padding, position[1] - 25),
                  (position[0] + max_width + padding, position[1] + total_height),
                  (0, 0, 0), -1)  # Black background
    
    # Add text lines
    y = position[1]
    for line in text_lines:
        cv2.putText(result, line, (position[0], y), font, font_scale, font_color, thickness, line_type)
        y += 30
    
    return result

def run_slic_experiments(image_path, output_dir='slic_experiments'):
    """
    Run SLIC experiments with different parameter combinations
    
    Args:
        image_path: Path to input image
        output_dir: Directory to save results
    """
    # Create output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    experiment_dir = os.path.join(output_dir, f"experiment_{timestamp}")
    os.makedirs(experiment_dir, exist_ok=True)
    
    # Load image
    print(f"Loading image from {image_path}...")
    img = load_image(image_path)
    height, width = img.shape[:2]
    
    # Save original image
    cv2.imwrite(os.path.join(experiment_dir, "original.jpg"), img)
    
    # Define parameter ranges
    region_sizes = [10, 30, 60, 100, 150]
    rulers = [5.0, 10.0, 20.0, 40.0]
    iterations = [5, 10, 20]
    algorithms = [
        (cv2.ximgproc.SLIC, "SLIC"),
        (cv2.ximgproc.SLICO, "SLICO"),
        (cv2.ximgproc.MSLIC, "MSLIC")
    ]
    
    # Create a summary image
    results = []
    experiment_count = 0
    
    # Run experiments
    print("Running SLIC experiments...")
    for region_size, ruler, iteration, (algorithm, alg_name) in itertools.product(
            region_sizes, rulers, iterations, algorithms):
        
        experiment_count += 1
        print(f"Experiment {experiment_count}: region_size={region_size}, ruler={ruler}, "
              f"iterations={iteration}, algorithm={alg_name}")
        
        # Apply SLIC
        result, n_segments = apply_slic(img, region_size, ruler, iteration, algorithm)
        
        if result is not None:
            # Add parameter information to the image
            text_lines = [
                f"Algorithm: {alg_name}",
                f"Region Size: {region_size}",
                f"Ruler: {ruler}",
                f"Iterations: {iteration}",
                f"Segments: {n_segments}"
            ]
            result_with_text = add_text_to_image(result, text_lines)
            
            # Save individual result
            filename = f"{alg_name}_r{region_size}_ruler{ruler}_iter{iteration}.jpg"
            cv2.imwrite(os.path.join(experiment_dir, filename), result_with_text)
            
            # Store for comparison grid
            results.append({
                'image': result_with_text,
                'params': {
                    'algorithm': alg_name,
                    'region_size': region_size,
                    'ruler': ruler,
                    'iterations': iteration,
                    'segments': n_segments
                }
            })
    
    # Create comparison grids for specific parameter variations
    create_comparison_grids(results, img, experiment_dir)
    
    print(f"\nExperiment complete! Results saved to: {experiment_dir}")
    print(f"Total experiments: {experiment_count}")
    
    return experiment_dir

def create_comparison_grids(results, original_img, output_dir):
    """
    Create comparison grids for different parameter variations
    
    Args:
        results: List of experiment results
        original_img: Original input image
        output_dir: Directory to save grids
    """
    height, width = original_img.shape[:2]
    
    # 1. Grid comparing region sizes (fixed algorithm=SLICO, ruler=10, iterations=10)
    create_grid_by_parameter(results, output_dir, 'region_size', 
                           fixed_params={'algorithm': 'SLICO', 'ruler': 10.0, 'iterations': 10},
                           grid_title="Region Size Comparison (SLICO, ruler=10, iter=10)")
    
    # 2. Grid comparing rulers (fixed algorithm=SLICO, region_size=60, iterations=10)
    create_grid_by_parameter(results, output_dir, 'ruler',
                           fixed_params={'algorithm': 'SLICO', 'region_size': 60, 'iterations': 10},
                           grid_title="Ruler Comparison (SLICO, region=60, iter=10)")
    
    # 3. Grid comparing algorithms (fixed region_size=60, ruler=10, iterations=10)
    create_grid_by_parameter(results, output_dir, 'algorithm',
                           fixed_params={'region_size': 60, 'ruler': 10.0, 'iterations': 10},
                           grid_title="Algorithm Comparison (region=60, ruler=10, iter=10)")
    
    # 4. Grid comparing iterations (fixed algorithm=SLICO, region_size=60, ruler=10)
    create_grid_by_parameter(results, output_dir, 'iterations',
                           fixed_params={'algorithm': 'SLICO', 'region_size': 60, 'ruler': 10.0},
                           grid_title="Iterations Comparison (SLICO, region=60, ruler=10)")

def create_grid_by_parameter(results, output_dir, varying_param, fixed_params, grid_title):
    """
    Create a grid comparing results with one varying parameter
    
    Args:
        results: List of all results
        output_dir: Output directory
        varying_param: Parameter that varies
        fixed_params: Dictionary of fixed parameters
        grid_title: Title for the grid
    """
    # Filter results based on fixed parameters
    filtered_results = []
    for result in results:
        params = result['params']
        match = True
        for key, value in fixed_params.items():
            if params[key] != value:
                match = False
                break
        if match:
            filtered_results.append(result)
    
    if not filtered_results:
        return
    
    # Sort by varying parameter
    filtered_results.sort(key=lambda x: x['params'][varying_param])
    
    # Create grid
    n_images = len(filtered_results)
    if n_images == 0:
        return
    
    # Calculate grid dimensions
    cols = min(3, n_images)
    rows = (n_images + cols - 1) // cols
    
    # Get image dimensions
    img_height, img_width = filtered_results[0]['image'].shape[:2]
    
    # Create grid image
    grid_width = img_width * cols
    grid_height = img_height * rows + 50  # Extra space for title
    grid = np.zeros((grid_height, grid_width, 3), dtype=np.uint8)
    
    # Add title
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(grid, grid_title, (20, 35), font, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
    
    # Place images in grid
    for idx, result in enumerate(filtered_results):
        row = idx // cols
        col = idx % cols
        
        y_start = row * img_height + 50
        y_end = y_start + img_height
        x_start = col * img_width
        x_end = x_start + img_width
        
        grid[y_start:y_end, x_start:x_end] = result['image']
    
    # Save grid
    filename = f"grid_{varying_param}_comparison.jpg"
    cv2.imwrite(os.path.join(output_dir, filename), grid)

def main():
    """
    Main function to run SLIC parameter experiments
    """
    # Replace with your image path
    image_path = "alan.jpg"
    
    # Run experiments
    output_dir = run_slic_experiments(image_path)
    
    # Create a simple viewer to browse results
    create_html_viewer(output_dir)

def create_html_viewer(output_dir):
    """
    Create an HTML file to easily view all results
    
    Args:
        output_dir: Directory containing experiment results
    """
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>SLIC Parameter Experiment Results</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .grid-container { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 10px;
                margin-top: 20px;
            }
            .grid-item { 
                border: 1px solid #ddd;
                padding: 10px;
                text-align: center;
            }
            .grid-item img { 
                max-width: 100%; 
                height: auto;
            }
            .comparison-grids {
                margin-top: 40px;
            }
            .comparison-grids img {
                max-width: 100%;
                height: auto;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <h1>SLIC Parameter Experiment Results</h1>
        
        <h2>Comparison Grids</h2>
        <div class="comparison-grids">
    """
    
    # Add comparison grids
    grid_files = ['grid_region_size_comparison.jpg', 'grid_ruler_comparison.jpg', 
                  'grid_algorithm_comparison.jpg', 'grid_iterations_comparison.jpg']
    
    for grid_file in grid_files:
        if os.path.exists(os.path.join(output_dir, grid_file)):
            html_content += f'<img src="{grid_file}" alt="{grid_file}"><br>\n'
    
    html_content += """
        </div>
        
        <h2>Individual Results</h2>
        <div class="grid-container">
    """
    
    # Add individual results
    for filename in sorted(os.listdir(output_dir)):
        if filename.endswith('.jpg') and not filename.startswith('grid_') and filename != 'original.jpg':
            html_content += f"""
            <div class="grid-item">
                <img src="{filename}" alt="{filename}">
                <p>{filename}</p>
            </div>
            """
    
    html_content += """
        </div>
    </body>
    </html>
    """
    
    # Save HTML file
    html_path = os.path.join(output_dir, 'index.html')
    with open(html_path, 'w') as f:
        f.write(html_content)
    
    print(f"HTML viewer created: {html_path}")

if __name__ == "__main__":
    main()