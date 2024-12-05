const adminModel = require("../../../models/admin-model");
const foodMainCategory = require("../../../models/food-main-category");
const { SUPER_ADMIN } = require("../../../utils/userRoles");

module.exports = {
    getAdminBannersAndServicesByPagination: async (page, limit) => {
        try {
            const adminBanners = await adminModel.findOne(
                {
                    role: SUPER_ADMIN
                },
                {
                    banners: { $slice: [page, limit] }, // Paginate the banners array
                    services: { $slice: [page, limit] },
                }
            )
                .select("heading description image")
                .toArray();
            return adminBanners;
        } catch (err) {
            console.error("Error getAdminBannersByPagination (from admin service file):", err);
            return false;
        }
    },

    getMainCategory: async (page, limit) => {
        try {
            const skip = (page - 1) * limit;

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
                .limit(limit)
                .toArray();
            return mainCategory;
        } catch (error) {
            console.error("Error getMainCategory (from admin service file):", err);
            return false;
        }
    }
}