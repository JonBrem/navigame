package de.ur.iw.navigame.server;

import de.ur.iw.navigame.utility.UnifiedServlet;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 *
 */
@WebServlet(name = "AppServlet")
public class AppServlet extends UnifiedServlet {

    @Override
    protected void handleRequest(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    }
}
