package de.ur.iw.navigame.utility;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * The UnifiedServlet unites the doPost and doGet-methods of a HttpServlet in one method (handleRequest).
 * This is helpful because it doesn't matter for this application and this can be a source for odd mistakes.
 */
public abstract class UnifiedServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        handleRequest(request, response);
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        handleRequest(request, response);
    }

    /**
     * Handles both GET and POST request (you could still make a distinction via request.getMethod())
     */
    protected abstract void handleRequest(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException;
}
