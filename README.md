## Backend for gluten peek app

### Tasks Left:
- post request for each scan DONE 

- post request when reporting symptoms DONE

- get request for day data with paremeter for number of days, so that a suitable number of days is returned DONE

- post request for claims, so that a user can make a claim and descirbe whats wrong with a labelling DONE

- get product by barcode: add barcode field to product, and when the user scans another request is done to return the result of the scan ie the product scanned DONE

- make a patch status request, it updates the status on request

### Integration with frontend:

#### Scanning:
- steps that are done on scan are as follows:
first make a post request to labels, then
check in products by barcode , if there, first check if status is outdated depending on product type, fresh products should be updated daily, other should be done weekly, if status is outdated, make a request to gemini to search the ingredients list and the internet and make the correct labeling and updating the label description. not there? then check in open food facts, if there, make a product in the database and make a status with the status of this product as gotten the status from open food facts, not there (not in open food facts?) then request more photos that an ai labels as gibirish or usable, if usable, use transformer ocr to fill in all the data for the new product and its barcode and check for its status by gemini. Return the whole product upon scanning, including data related to whether symptoms were reported in the last few days by people.

- symptom labeling, by each scan u can label what symptoms felt, triggering post and automatically updating data for product for all users.

- labelling or flaging incorrect product placement requires the product, an description and media / link proof, goes to gemini where gemini + admin confirmation flags the product accordingly and closes the labelling request.

- dashboard, cached name and pfp and bios, updated daily by get user, cached last month only, updated weekly, and every new request is also added to cache