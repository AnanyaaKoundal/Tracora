import z from "zod";
import { Bug, CreateBugInput, createBugSchema } from "@/schemas/bug.schema";

let URL = "http://localhost:5000";

export const fetchDashboardData = async () => {
    const res = await fetch(`${URL}/employee/dashboard`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (res.status === 403) {
        return { error: "Forbidden", status: 403, success: false };
    }

    if (!res.ok) {
        throw new Error("Failed to fetch data");
    }

    const data = await res.json(); // wait for the promise to resolve
    console.log("RESSS: ", data);

    return data;
}
