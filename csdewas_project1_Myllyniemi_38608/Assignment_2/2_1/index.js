$(document).ready(function () {
    $("#barcodeField").focus(function() {
        $("#barcodeField").css("background-color","lightgray");
    });
    $("#barcodeField").blur( function() {
        $("#barcodeField").css("background","");
    });

    $("#hideButton").click(function () {
        $("#outputBox").slideToggle();
        if($(this).html() === "Hide"){
            $(this).html("Show");
        }else{
            $(this).html("Hide");
        }
    });

    $("#decodeButton").click(function () {
        var barcode = $("#barcodeField").val().replace(/\s+/g,'');
        var version = parseInt(barcode.charAt(0));
        if(version === 4 || version === 5 && barcode.length === 54){
            generateBarcode(barcode);
            $("#iban").html("Payee's IBAN: " + getIban(version, barcode));
            $("#amount").html("Amount to be paid: " + getAmount(version, barcode));
            $("#reference").html("Payment reference: " + getReference(version, barcode));
            $("#dueDate").html("Due date: " + getDueDate(version, barcode));
        }else{
            generateBarcode("0000000000000000000000000000000000000000");
            $("#iban").html("Payee's IBAN: ");
            $("#amount").html("Amount to be paid: ");
            $("#reference").html("Payment reference: ");
            $("#dueDate").html("Due date: ");
        }
    });
    function reverseString(str) {
        var splitString = str.split("");
        var reverseArray = splitString.reverse();
        var joinArray = reverseArray.join("");
        //This will be used to ensure that the reference number is in the correct "format", while using version 4
        return joinArray;
    }
    function generateBarcode(value){
        JsBarcode("#barcode", value);
    }
    function getIban(version, value){
        if(version === 4 || version === 5){
            var iban = value.substring(1, 17);
            iban = insertChar(iban, ' ', 2);
            iban = insertChar(iban, ' ', 7);
            iban = insertChar(iban, ' ', 12);
            iban = insertChar(iban, ' ', 17);
            return iban;
        }else{
            return "";
        }

    }
    function getAmount(version, value){
        var euros = getEuros(version, value);
        var cents = getCents(version, value);
        switch(version){
            case 4: return parseFloat(euros).toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,') + "." + cents;
            case 5: return parseFloat(euros) + "," + cents;
            default: return "None";
        }

    }
    function insertChar(str, char, position){
        return [str.slice(0, position), char, str.slice(position)].join('');
    }
    function getEuros(version, value){
        return value.substring(17, 23);
    }
    function getCents(version, value){
        return value.substring(23, 25);
    }
    function getReference(version, value){
        switch(version){
            case 4: return reverseString(reverseString(value.substring(25, 48).replace(/^0+/, '')).replace(/(\d{5})/g, '$1 '));
            case 5:
            var ref1 = value.substring(25, 27);
            var ref2 = value.substring(27, 48).replace(/^0+/, '');
            return ("RF"+(ref1+ref2)).replace(/(\w{4})/g, '$1 ');
            // Ensuring that the reference number is in the correct format while using version 5
            default: return "None";
        }
    }
    function getDueDate(version, value){
        if(value.substring(48,54) === "000000"){
            return "None";
        }
        switch(version){
            case 4: return value.substring(52, 54) + "." + parseInt(value.substring(50, 52)) + "." + (new Date()).getFullYear().toString().substring(0,2) + value.substring(48, 50);
            case 5: return parseInt(value.substring(52, 54)) + "." + parseInt(value.substring(50, 52)) + "." + (new Date()).getFullYear().toString().substring(0,2) + value.substring(48, 50);
            default: return "None";
        }
    }
});
