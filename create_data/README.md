
## Usage of data creator

1. pip install opencv-contrib-python
2. cd data/create_data
3. Open SLIC.py and update the input image path. The output path will be:data/create_data/slic_result/{image_name} by default.
4. run SLIC.py
5. Review the generated superpixel segmentations, manually Pick 7 images based on difficulty (from easy to hard).
6. Rename the selected 7 images as: 1 (easiest) to 7 (hardest).
7. Delete all other images, keep only 1 ~ 7 and original image (total 8 images)
8. move this folder to "/dataset", copy the original image to "/original" 
9. for next image, repeate steps 3 ~ 8

# named your image as "{name of the animate}_n"
