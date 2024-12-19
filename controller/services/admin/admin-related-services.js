const adminModel = require("../../../models/admin-model");
const foodMainCategory = require("../../../models/food-main-category");
const { SUPER_ADMIN } = require("../../../utils/userRoles");

module.exports = {
    getAdminBannersAndServicesByPagination: async (page, limit) => {
        try {
            
            const skip = (page - 1) * limit; // Calculate the starting index for pagination
    
            // Use the correct structure for `$slice` within the projection
            const adminBanners = await adminModel.findOne(
                { role: SUPER_ADMIN },
                {
                    banners: { $slice: [skip, Number(limit)] }, // Paginate banners
                    services: { $slice: [skip, Number(limit)] }, // Paginate services
                }
            );
            
            if (adminBanners) {
                // Manually pick fields if needed (since `$slice` ignores `select`)
                adminBanners.banners = adminBanners.banners.map(({ heading, description, image }) => ({
                    heading,
                    description,
                    image,
                }));
                adminBanners.services = adminBanners.services.map(({ heading, description, image }) => ({
                    heading,
                    description,
                    image,
                }));
            }
    
            return adminBanners;
        } catch (err) {
            console.error("Error getAdminBannersByPagination (from admin service file):", err);
            return false;
        }
    },
    

    getMainCategory: async (page, limit) => {
        try {
            let pageLimit = Number(limit);
            const skip = (page - 1) * pageLimit;

            const mainCategory = await foodMainCategory.find(
                {},
                {
                    name: 1,
                    image: 1
                })
                .sort(
                    {
                        createdAt: -1
                    })
                .skip(skip)
                .limit(pageLimit);
            return mainCategory;
        } catch (error) {
            console.error("Error getMainCategory (from admin service file):", error);
            return false;
        }
    }
}