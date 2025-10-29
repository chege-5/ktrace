import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
    {
        id_number:{type:Number,required:true},
        lotId:{type:String, unique:true, required:true},
        weight:{type:Number,required:true},
        date:{type:Date,default:Date.now},
        defects: {insect:Number, broken:Number, unripe:Number},
        moistureContent: {type:Number, required:true},
        cuppingScore: {
            flavour: Number,
            acidity: Number,
            aroma: Number,
            body: Number,
            aftertaste: String,
            total: Number
        },
        grade: String,
        totalPayout: {type:Number},
        payoutStatus: {type:String, default:"pending"}
});
const Delivery = mongoose.model("Delivery",deliverySchema);

export default Delivery;