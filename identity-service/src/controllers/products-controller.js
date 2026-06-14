export const productsController = async (req, res, next) => {
  try {
    let url = `https://dummyjson.com/products`;
    const response = await fetch(url);
    const jsonData = await response.json();

    res.json({
      success: true,
      data: jsonData.products,
    });
  } catch (error) {
    logger.error("Error while fetching products.", error);
    return res.status(500).json({
      success: false,
      message: "Error while fetching products",
    });
  }
};
